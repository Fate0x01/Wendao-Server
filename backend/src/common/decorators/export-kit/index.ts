import { applyDecorators, CallHandler, ExecutionContext, Injectable, NestInterceptor, UseInterceptors } from '@nestjs/common'
import { ApiProduces, ApiResponse } from '@nestjs/swagger'
import { Response } from 'express'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import * as XLSX from 'xlsx'

interface SheetData {
  /** Sheet 名称 */
  name: string
  /** 表头 */
  headers: string[]
  /** 数据行 */
  rows: any[][]
}

/**
 * 1. Excel 导出结果封装类 (支持多 Sheet)
 */
export class ExcelResult {
  public readonly filename: string
  public readonly sheets: SheetData[] = []

  constructor(options: {
    filename: string
    /** 模式 A: 单个 Sheet (快捷方式) */
    headers?: string[]
    rows?: any[][]
    sheetName?: string
    /** 模式 B: 多个 Sheet (完整模式) */
    sheets?: SheetData[]
  }) {
    this.filename = options.filename

    // 优先使用 sheets 数组
    if (options.sheets && options.sheets.length > 0) {
      this.sheets = options.sheets
    }
    // 降级使用单 Sheet 属性
    else if (options.headers && options.rows) {
      this.sheets = [
        {
          name: options.sheetName || 'Sheet1',
          headers: options.headers,
          rows: options.rows,
        },
      ]
    }
  }
}

/**
 * 2. 通用二进制文件结果封装类 (用于 PDF, Zip, Image 等)
 */
export class RawFileResult {
  constructor(
    public readonly payload: {
      /** 下载文件名 */
      filename: string
      /** 文件内容 (Buffer 或 字符串) */
      buffer: Buffer | string | Uint8Array
      /** MIME 类型，不传默认为 'application/octet-stream' */
      contentType?: string
    },
  ) {}
}

/**
 * 文件下载拦截器
 * 自动识别 ExcelResult 和 RawFileResult 并转换为文件流响应
 */
@Injectable()
export class FileDownloadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>()

        // 🟢 场景 A: 处理 Excel 导出
        if (data instanceof ExcelResult) {
          const wb = XLSX.utils.book_new()
          // 遍历添加所有 Sheet
          data.sheets.forEach((sheet) => {
            const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])
            XLSX.utils.book_append_sheet(wb, ws, sheet.name)
          })
          const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
          this.setHeaders(response, data.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer.length)
          // 注意：必须使用 response.send() 而不是 return StreamableFile
          // 原因：如果项目中存在全局拦截器（如 GlobalDateTransformInterceptor），它会尝试递归遍历
          // StreamableFile 对象并将其转化为 JSON，导致下载文件损坏。
          // 而 response.send() 后，我们可以安全地 return null，全局拦截器通常会忽略 null。
          response.send(buffer)
          return null
        }

        // 🟢 场景 B: 处理通用文件导出 (RawFileResult)
        if (data instanceof RawFileResult) {
          const { filename, buffer, contentType } = data.payload
          const length = Buffer.isBuffer(buffer) ? buffer.length : Buffer.byteLength(buffer as string)
          // ✨ 默认回退到二进制流
          const finalContentType = contentType || 'application/octet-stream'
          this.setHeaders(response, filename, finalContentType, length)
          // ✨ 同上，直接发送数据
          response.send(buffer)
          return null
        }

        // 如果不是特殊对象，原样返回
        return data
      }),
    )
  }

  /**
   * 辅助方法：统一设置响应头
   */
  private setHeaders(res: Response, filename: string, contentType: string, length: number) {
    // 解决中文文件名乱码问题
    const encodedFilename = encodeURIComponent(filename)
    // Access-Control-Expose-Headers 是为了让前端能读取到 Content-Disposition
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    res.setHeader('Content-Disposition', `attachment; filename=${encodedFilename}; filename*=UTF-8''${encodedFilename}`)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', length)
  }
}

interface DownloadOptions {
  /** Swagger 文档描述 */
  description?: string
  /** 文件 MIME 类型，默认 application/octet-stream */
  contentType?: string
}

/**
 * 通用文件下载装饰器
 * 1. 自动配置 Swagger 文档 (@Produces, @ApiResponse)
 * 2. 挂载 DownloadInterceptor 用于处理 ExcelResult / RawFileResult
 */
export function UseFileDownload(options: DownloadOptions = {}) {
  // ✨ 默认为二进制流，方便省略参数
  const contentType = options.contentType || 'application/octet-stream'
  return applyDecorators(
    UseInterceptors(FileDownloadInterceptor),
    ApiProduces(contentType),
    ApiResponse({
      schema: {
        type: 'String',
        format: 'binary',
        description: options.description || '下载文件',
      },
    }),
  )
}

// =================================================================================
//  👇 使用示例 (可直接复制到 Controller 中使用)
// =================================================================================
/*
// 引入依赖
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UseFileDownload, ExcelResult, RawFileResult } from '../../common/decorators/file-upload.kit';

@ApiTags('文件下载示例')
@Controller('examples/download')
export class DownloadExampleController {

  // 场景 1: 简单 Excel 导出 (单 Sheet)
  // 不需要关心 Header 设置，不需要关心 Buffer 转换
  @Get('excel/simple')
  @ApiOperation({ summary: '导出简单报表' })
  @UseFileDownload({ description: '月度报表.xlsx' })
  async exportSimpleExcel() {
    return new ExcelResult({
      filename: '月度报表.xlsx',
      sheetName: '一月数据',
      headers: ['ID', '姓名', '部门', '入职日期'],
      rows: [
        [101, '张三', '技术部', '2023-01-01'],
        [102, '李四', '市场部', '2023-02-15'],
      ],
    });
  }

  // 场景 2: 复杂 Excel 导出 (多 Sheet)
  @Get('excel/complex')
  @ApiOperation({ summary: '导出多 Sheet 报表' })
  @UseFileDownload({ description: '年度汇总.xlsx' })
  async exportComplexExcel() {
    return new ExcelResult({
      filename: '年度汇总.xlsx',
      sheets: [
        {
          name: '收入表',
          headers: ['日期', '来源', '金额'],
          rows: [['2023-01-01', '订单收入', 1000]],
        },
        {
          name: '支出表',
          headers: ['日期', '用途', '金额'],
          rows: [['2023-01-05', '服务器费用', 200]],
        },
      ],
    });
  }

  // 场景 3: 导出 PDF 或任意二进制文件
  @Get('pdf/contract')
  @ApiOperation({ summary: '下载合同 PDF' })
  @UseFileDownload({ 
    description: '电子合同', 
    contentType: 'application/pdf' // 可选：指定文档类型让 Swagger 更准确
  })
  async exportPdf() {
    // 模拟 PDF Buffer
    const pdfBuffer = Buffer.from('Fake PDF Content'); 
    
    return new RawFileResult({
      filename: '合同-2023001.pdf',
      buffer: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  // 场景 4: 导出文本/日志文件
  @Get('text/log')
  @ApiOperation({ summary: '下载运行日志' })
  @UseFileDownload()
  async exportLog() {
    const logContent = `
      [INFO] 2023-01-01 System start
      [WARN] 2023-01-02 Memory usage high
    `;

    return new RawFileResult({
      filename: 'system.log',
      buffer: logContent, // 直接传字符串也可以
      contentType: 'text/plain',
    });
  }
}
*/
