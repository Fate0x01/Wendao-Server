import { applyDecorators, FileValidator, HttpStatus, Injectable, ParseFilePipeBuilder, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes } from '@nestjs/swagger'

// 默认配置
const DEFAULT_MAX_SIZE = 1024 * 1024 * 10 // 默认 10MB

/**
 * 自定义文件类型验证器
 * 解决 NestJS 原生 FileTypeValidator 在正则匹配时的各种诡异问题
 */
@Injectable()
export class CustomFileTypeValidator extends FileValidator<{ fileType: string | RegExp }> {
  isValid(file?: any): boolean {
    if (!this.validationOptions) {
      return true
    }
    const { fileType } = this.validationOptions
    // 容错处理：如果没有 mimetype，直接视为不合法
    if (!file || !file.mimetype) {
      return false
    }
    // 1. 正则匹配模式
    if (fileType instanceof RegExp) {
      return fileType.test(file.mimetype)
    }
    // 2. 字符串精确匹配模式
    return file.mimetype === fileType
  }
  buildErrorMessage(file: any): string {
    return `不支持的文件类型: ${file?.mimetype}。请上传符合要求的文件格式。`
  }
}

/**
 * 常用文件类型简写映射
 */
const FILE_TYPE_MAP = {
  image: /^image\/(jpg|jpeg|png|gif|webp)$/, // 图片：匹配 jpg, jpeg, png, gif, webp
  xlsx: /(spreadsheetml\.sheet|vnd\.ms-excel)/, // Excel: 只要包含 spreadsheetml.sheet 或者 vnd.ms-excel 就通过
  xls: /(spreadsheetml\.sheet|vnd\.ms-excel)/,
  excel: /(spreadsheetml\.sheet|vnd\.ms-excel)/,
  docx: /wordprocessingml\.document/, // Word
  pdf: /application\/pdf/, // PDF
  csv: /text\/csv/, // CSV
  txt: /text\/plain/, // 文本
}

type FileTypeShortcuts = keyof typeof FILE_TYPE_MAP

interface UploadOptions {
  fieldName?: string
  required?: boolean
  description?: string
  extraProperties?: Record<string, any>
}

interface ValidationOptions {
  required?: boolean
  maxSize?: number
  /** 支持简写 'excel', 'image' 或自定义正则 */
  fileType?: FileTypeShortcuts | string | RegExp
}

export function UseFileUpload(options: UploadOptions = {}) {
  const fieldName = options.fieldName || 'file'
  const isRequired = options.required ?? true
  const extraProperties = options.extraProperties || {}
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: isRequired ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
            description: options.description || '上传文件',
          },
          ...extraProperties,
        },
      },
    }),
  )
}

export function GetFile(options: ValidationOptions = {}) {
  const isRequired = options.required ?? true
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
  // 1. 构建基础 Pipe (主要用于校验大小)
  const pipeBuilder = new ParseFilePipeBuilder().addMaxSizeValidator({
    maxSize: maxSize,
    message: (maxSize) => `文件大小不能超过 ${maxSize / 1024 / 1024}MB`,
  })
  // 2. 添加自定义类型验证器 (解决原生验证器的 Bug)
  if (options.fileType) {
    let targetType = options.fileType
    // 映射简写
    if (typeof targetType === 'string' && FILE_TYPE_MAP[targetType as string]) {
      targetType = FILE_TYPE_MAP[targetType as string]
    }
    // 使用我们自定义的验证器，而不是 addFileTypeValidator
    pipeBuilder.addValidator(
      new CustomFileTypeValidator({
        fileType: targetType as string | RegExp,
      }),
    )
  }
  return UploadedFile(
    pipeBuilder.build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      fileIsRequired: isRequired,
    }),
  )
}

// =================================================================================
//  👇 使用示例 (可直接复制到 Controller 中使用)
// =================================================================================
/*
// 引入依赖
import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { 
  UseFileUpload, GetFile, 
  UseFileDownload, ExcelResult, RawFileResult 
} from '../../common/decorators/file-upload.kit';

@ApiTags('文件处理示例')
@Controller('examples')
export class FileExampleController {

  // ============================================================
  //  📤 上传场景示例 (Upload Examples)
  // ============================================================

  // 场景 1: 简单 Excel 上传
  // 需求：只允许上传 Excel (.xlsx/.xls)，默认大小限制 (10MB)
  @Post('upload/excel')
  @ApiOperation({ summary: '上传 Excel 报表' })
  @UseFileUpload({ description: '请上传月度报表 (.xlsx/.xls)' })
  async uploadExcel(
    // ✨ 使用简写 'excel'，自动兼容 .xlsx 和 .xls，避免正则报错
    @GetFile({ fileType: 'excel' }) file: Express.Multer.File,
  ) {
    console.log(`接收文件: ${file.originalname}`);
    // return this.excelService.parse(file.buffer);
    return { status: 'success', filename: file.originalname };
  }

  // 场景 2: 上传文件 + 附加参数 (最常用)
  // 需求：上传同时需要 tenantId 和 remark，且在 Swagger 中显示
  @Post('upload/params')
  @ApiOperation({ summary: '带参数的文件上传' })
  @UseFileUpload({
    description: '上传资料',
    // ✨ 这里的定义会自动合并到 Swagger 文档，无需手写 @ApiBody
    extraProperties: {
      tenantId: { type: 'string', description: '租户ID', example: 'T001' },
      remark: { type: 'string', description: '备注信息', required: false },
    },
  })
  async uploadWithParams(
    @GetFile() file: Express.Multer.File, // 不传参数默认允许任意类型，限 10MB
    @Body('tenantId') tenantId: string,   // 获取 Body 参数
    @Body('remark') remark?: string,
  ) {
    console.log(`租户[${tenantId}] 上传了: ${file.originalname}, 备注: ${remark}`);
    return { id: 'FILE-' + Date.now() };
  }

  // 场景 3: 图片上传 (严格限制)
  // 需求：只允许图片，且限制大小为 2MB
  @Post('upload/avatar')
  @ApiOperation({ summary: '上传用户头像' })
  @UseFileUpload({ description: '用户头像 (jpg/png)' })
  async uploadAvatar(
    @GetFile({
      fileType: 'image',        // 使用内置图片正则
      maxSize: 1024 * 1024 * 2, // 限制 2MB
    })
    file: Express.Multer.File,
  ) {
    // return this.ossService.upload(file);
    return { url: 'https://cdn.example.com/avatar/123.jpg' };
  }
*/
