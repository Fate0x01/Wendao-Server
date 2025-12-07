import { Body, Controller, Delete, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import { GetFile, UseFileUpload } from 'src/common/decorators/upload-kit'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { AddExtraCostDto } from './dto/add-extra-cost.dto'
import { ChangeLogQueryDto } from './dto/change-log-query.dto'
import { GoodsQueryDto } from './dto/goods-query.dto'
import { UpdateGoodsDto } from './dto/update-goods.dto'
import { ChangeLogEntity } from './entities/change-log.entity'
import { ExtraCostEntity } from './entities/extra-cost.entity'
import { GoodsImportResultEntity } from './entities/goods-import-result.entity'
import { GoodsEntity } from './entities/goods.entity'
import { SysGoodsService } from './sys_goods.service'

@ApiTags('商品管理')
@Controller('sys-goods')
export class SysGoodsController {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
    private readonly sysGoodsService: SysGoodsService,
  ) {}

  @Post('import')
  @ApiOperation({ summary: '导入商品' })
  @UseFileUpload({ description: '导入商品Excel' })
  @ApiResult(GoodsImportResultEntity)
  @Permission({ group: '商品管理', name: '导入商品', model: 'Goods', code: 'goods:import' })
  async importGoods(@GetFile({ fileType: 'excel' }) file: Express.Multer.File) {
    const result = await this.sysGoodsService.importGoods(file)
    return ResultData.ok(result)
  }

  @Post('list')
  @ApiOperation({ summary: '查询商品列表' })
  @ApiResult(GoodsEntity, true, true)
  @Permission({ group: '商品管理', name: '商品列表', model: 'Goods', code: 'goods:list' })
  async getGoodsList(@Body() query: GoodsQueryDto) {
    const { rows, total } = await this.sysGoodsService.list(query)
    return ResultData.list(rows, total)
  }

  @Post('update')
  @ApiOperation({ summary: '修改商品' })
  @ApiResult(GoodsEntity)
  @Permission({ group: '商品管理', name: '修改商品', model: 'Goods', code: 'goods:update' })
  async updateGoods(@Body() dto: UpdateGoodsDto) {
    const goods = await this.sysGoodsService.update(dto)
    return ResultData.ok(goods)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  @ApiResult(GoodsEntity)
  @Permission({ group: '商品管理', name: '删除商品', model: 'Goods', code: 'goods:delete' })
  async deleteGoods(@Param('id') id: string) {
    const goods = await this.sysGoodsService.remove(id)
    return ResultData.ok(goods)
  }

  @Post('change-logs')
  @ApiOperation({ summary: '查询商品变动日志列表' })
  @ApiResult(ChangeLogEntity, true, true)
  @Permission({ group: '商品管理', name: '商品变动日志', model: 'GoodChangeLog', code: 'goods:change-logs' })
  async getChangeLogs(@Body() query: ChangeLogQueryDto) {
    const { rows, total } = await this.sysGoodsService.getChangeLogs(query)
    return ResultData.list(rows, total)
  }

  @Post('add-extra-cost')
  @ApiOperation({ summary: '添加指定商品额外成本' })
  @ApiResult(ExtraCostEntity)
  @Permission({ group: '商品管理', name: '添加额外成本', model: 'Goods', code: 'goods:add-extra-cost' })
  async addExtraCost(@Body() dto: AddExtraCostDto) {
    const extraCost = await this.sysGoodsService.addExtraCost(dto)
    return ResultData.ok(extraCost)
  }

  @Delete('extra-cost/:id')
  @ApiOperation({ summary: '删除指定商品的指定额外成本' })
  @ApiResult(ExtraCostEntity)
  @Permission({ group: '商品管理', name: '删除额外成本', model: 'Goods', code: 'goods:delete-extra-cost' })
  async deleteExtraCost(@Param('id') id: string) {
    const extraCost = await this.sysGoodsService.removeExtraCost(id)
    return ResultData.ok(extraCost)
  }

  @Post('import-emg-sku-mapping')
  @ApiOperation({ summary: '导入 EMG/SKU 映射' })
  @UseFileUpload({ description: '导入 EMG/SKU 映射 Excel' })
  @ApiResult(GoodsImportResultEntity)
  @Permission({ group: '商品管理', name: '导入 EMG/SKU 映射', model: 'Goods', code: 'goods:import-emg-sku-mapping' })
  async importEmgSkuMapping(@GetFile({ fileType: 'excel' }) file: Express.Multer.File) {
    const result = await this.sysGoodsService.importEmgSkuMapping(file)
    return ResultData.ok(result)
  }
}
