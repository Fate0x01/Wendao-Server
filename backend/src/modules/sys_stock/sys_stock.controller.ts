import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { UseFileDownload } from 'src/common/decorators/export-kit'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import { GetFile, UseFileUpload } from 'src/common/decorators/upload-kit'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { InventoryPoolInfoQueryDto } from './dto/inventory-pool-info-query.dto'
import { JingCangStockQueryDto } from './dto/jing-cang-stock-query.dto'
import { ListSharedInventoryPoolDto } from './dto/list-shared-inventory-pool.dto'
import { PurchaseOrderConfirmDto } from './dto/purchase-order-confirm.dto'
import { PurchaseOrderCreateDto } from './dto/purchase-order-create.dto'
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto'
import { PurchaseOrderUpdateDto } from './dto/purchase-order-update.dto'
import { RemoveSharedInventoryPoolDto } from './dto/remove-shared-inventory-pool.dto'
import { SetReorderThresholdDto } from './dto/set-reorder-threshold.dto'
import { SetSharedInventoryPoolDto } from './dto/set-shared-inventory-pool.dto'
import { SetYunCangReorderThresholdDto } from './dto/set-yun-cang-reorder-threshold.dto'
import { YunCangStockQueryDto } from './dto/yun-cang-stock-query.dto'
import { InventoryPoolInfoEntity } from './entities/inventory-pool-info.entity'
import { JingCangStockGroupEntity } from './entities/jing-cang-stock-group.entity'
import { JingCangStockInfoEntity } from './entities/jing-cang-stock-info.entity'
import { JingCangStockStatisticsEntity } from './entities/jing-cang-stock-statistics.entity'
import { PurchaseOrderEntity } from './entities/purchase-order.entity'
import { SharedInventoryPoolEntity } from './entities/shared-inventory-pool.entity'
import { StockImportResultEntity } from './entities/stock-import-result.entity'
import { YunCangStockGroupEntity } from './entities/yun-cang-stock-group.entity'
import { YunCangStockStatisticsEntity } from './entities/yun-cang-stock-statistics.entity'
import { SysStockService } from './sys_stock.service'

@ApiTags('库存管理')
@Controller('sys-stock')
export class SysStockController {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
    private readonly sysStockService: SysStockService,
  ) {}

  @Post('import-jing-cang-stock')
  @ApiOperation({ summary: '导入京仓库存信息' })
  @UseFileUpload({ description: '导入京仓库存信息 Excel' })
  @ApiResult(StockImportResultEntity)
  @Permission({ group: '库存管理', name: '导入京仓库存信息', model: 'JingCangStockInfo', code: 'stock:import-jing-cang-stock' })
  async importJingCangStock(@GetFile({ fileType: 'excel' }) file: Express.Multer.File) {
    const result = await this.sysStockService.importJingCangStock(file)
    return ResultData.ok(result)
  }

  @Post('list-yun-cang-stock')
  @ApiOperation({ summary: '查询云仓库存信息列表' })
  @ApiResult(YunCangStockGroupEntity, true, true)
  @Permission({ group: '库存管理', name: '查询云仓库存信息', model: 'YunCangStockInfo', code: 'stock:list-yun-cang-stock' })
  async listYunCangStock(@Body() query: YunCangStockQueryDto) {
    const { rows, total } = await this.sysStockService.listYunCangStock(query)
    return ResultData.list(rows, total)
  }

  @Post('statistics-yun-cang-stock')
  @ApiOperation({ summary: '统计云仓库存信息' })
  @ApiResult(YunCangStockStatisticsEntity)
  @Permission({ group: '库存管理', name: '查询云仓库存信息', model: 'YunCangStockInfo', code: 'stock:list-yun-cang-stock' })
  async statisticsYunCangStock(@Body() query: YunCangStockQueryDto) {
    const statistics = await this.sysStockService.statisticsYunCangStock(query)
    return ResultData.ok(statistics)
  }

  @Post('get-yun-cang-inventory-pool-info')
  @ApiOperation({ summary: '查询云仓库存池信息' })
  @ApiResult(InventoryPoolInfoEntity)
  @Permission({ group: '库存管理', name: '查询云仓库存信息', model: 'YunCangStockInfo', code: 'stock:list-yun-cang-stock' })
  async getYunCangInventoryPoolInfo(@Body() query: InventoryPoolInfoQueryDto) {
    const result = await this.sysStockService.getYunCangInventoryPoolInfo(query)
    return ResultData.ok(result)
  }

  @Post('list-jing-cang-stock')
  @ApiOperation({ summary: '查询京仓库存信息列表（按商品分组）' })
  @ApiResult(JingCangStockGroupEntity, true, true)
  @Permission({ group: '库存管理', name: '查询京仓库存信息', model: 'JingCangStockInfo', code: 'stock:list-jing-cang-stock' })
  async listJingCangStock(@Body() query: JingCangStockQueryDto) {
    const { rows, total } = await this.sysStockService.listJingCangStock(query)
    return ResultData.list(rows, total)
  }

  @Post('statistics-jing-cang-stock')
  @ApiOperation({ summary: '统计京仓库存信息' })
  @ApiResult(JingCangStockStatisticsEntity)
  @Permission({ group: '库存管理', name: '查询京仓库存信息', model: 'JingCangStockInfo', code: 'stock:list-jing-cang-stock' })
  async statisticsJingCangStock(@Body() query: JingCangStockQueryDto) {
    const statistics = await this.sysStockService.getJingCangStockStatistics(query)
    return ResultData.ok(statistics)
  }

  @Post('set-yun-cang-reorder-threshold')
  @ApiOperation({ summary: '设置云仓补货预警阈值' })
  @ApiResult(YunCangStockGroupEntity)
  @Permission({ group: '库存管理', name: '设置云仓补货预警阈值', model: 'YunCangStockInfo', code: 'stock:set-yun-cang-reorder-threshold' })
  async setYunCangReorderThreshold(@Body() dto: SetYunCangReorderThresholdDto) {
    const result = await this.sysStockService.setYunCangReorderThreshold(dto)
    return ResultData.ok(result)
  }

  @Post('set-reorder-threshold')
  @ApiOperation({ summary: '设置补货预警阈值' })
  @ApiResult(JingCangStockInfoEntity)
  @Permission({ group: '库存管理', name: '设置补货预警阈值', model: 'JingCangStockInfo', code: 'stock:set-reorder-threshold' })
  async setReorderThreshold(@Body() dto: SetReorderThresholdDto) {
    const stockInfo = await this.sysStockService.setReorderThreshold(dto)
    return ResultData.ok(stockInfo)
  }

  @Post('create-purchase-order')
  @ApiOperation({ summary: '创建采购订单' })
  @ApiResult(PurchaseOrderEntity)
  @Permission({ group: '库存管理', name: '创建采购订单', model: 'PurchaseOrder', code: 'stock:create-purchase-order' })
  async createPurchaseOrder(@Body() dto: PurchaseOrderCreateDto) {
    const result = await this.sysStockService.createPurchaseOrder(dto)
    return ResultData.ok(result)
  }

  @Post('list-purchase-order')
  @ApiOperation({ summary: '查询采购订单' })
  @ApiResult(PurchaseOrderEntity, true, true)
  @Permission({ group: '库存管理', name: '查询采购订单', model: 'PurchaseOrder', code: 'stock:list-purchase-order' })
  async listPurchaseOrder(@Body() query: PurchaseOrderQueryDto) {
    const { rows, total } = await this.sysStockService.listPurchaseOrder(query)
    return ResultData.list(rows, total)
  }

  @Post('update-purchase-order')
  @ApiOperation({ summary: '更新采购订单' })
  @ApiResult(PurchaseOrderEntity)
  @Permission({ group: '库存管理', name: '更新采购订单', model: 'PurchaseOrder', code: 'stock:update-purchase-order' })
  async updatePurchaseOrder(@Body() dto: PurchaseOrderUpdateDto) {
    const result = await this.sysStockService.updatePurchaseOrder(dto)
    return ResultData.ok(result)
  }

  @Post('confirm-purchase-order-by-department')
  @ApiOperation({ summary: '部门确认采购订单' })
  @ApiResult(Boolean)
  @Permission({ group: '库存管理', name: '部门确认采购订单', model: 'PurchaseOrder', code: 'stock:confirm-purchase-order-by-department' })
  async confirmPurchaseOrderByDepartment(@Body() dto: PurchaseOrderConfirmDto) {
    const result = await this.sysStockService.confirmPurchaseOrderByDepartment(dto)
    return ResultData.ok(result)
  }

  @Post('confirm-purchase-order-by-finance')
  @ApiOperation({ summary: '财务确认采购订单' })
  @ApiResult(Boolean)
  @Permission({ group: '库存管理', name: '财务确认采购订单', model: 'PurchaseOrder', code: 'stock:confirm-purchase-order-by-finance' })
  async confirmPurchaseOrderByFinance(@Body() dto: PurchaseOrderConfirmDto) {
    const result = await this.sysStockService.confirmPurchaseOrderByFinance(dto)
    return ResultData.ok(result)
  }

  @Post('export-yun-cang-stock')
  @ApiOperation({ summary: '导出云仓库存信息' })
  @UseFileDownload({ description: '导出云仓库存信息 Excel' })
  @Permission({ group: '库存管理', name: '导出云仓库存信息', model: 'YunCangStockInfo', code: 'stock:export-yun-cang-stock' })
  async exportYunCangStock(@Body() query: YunCangStockQueryDto) {
    return await this.sysStockService.exportYunCangStock(query)
  }

  @Post('export-purchase-order')
  @ApiOperation({ summary: '导出采购订单' })
  @UseFileDownload({ description: '导出采购订单 Excel' })
  @Permission({ group: '库存管理', name: '导出采购订单', model: 'PurchaseOrder', code: 'stock:export-purchase-order' })
  async exportPurchaseOrder(@Body() query: PurchaseOrderQueryDto) {
    return await this.sysStockService.exportPurchaseOrder(query)
  }

  @Post('export-jing-cang-stock')
  @ApiOperation({ summary: '导出京仓库存信息' })
  @UseFileDownload({ description: '导出京仓库存信息 Excel' })
  @Permission({ group: '库存管理', name: '导出京仓库存信息', model: 'JingCangStockInfo', code: 'stock:export-jing-cang-stock' })
  async exportJingCangStock(@Body() query: JingCangStockQueryDto) {
    return await this.sysStockService.exportJingCangStock(query)
  }

  @Post('set-shared-inventory-pool')
  @ApiOperation({ summary: '设置多个SKU共用一个库存池' })
  @ApiResult(SharedInventoryPoolEntity)
  @Permission({ group: '库存管理', name: '设置多个SKU共用库存池', model: 'YunCangStockInfo', code: 'stock:set-shared-inventory-pool' })
  async setSharedInventoryPool(@Body() dto: SetSharedInventoryPoolDto) {
    const result = await this.sysStockService.setSharedInventoryPool(dto)
    return ResultData.ok(result)
  }

  @Post('list-shared-inventory-pool')
  @ApiOperation({ summary: '查询库存池列表（多个SKU共用）' })
  @ApiResult(SharedInventoryPoolEntity, true, true)
  @Permission({ group: '库存管理', name: '查询库存池列表', model: 'YunCangStockInfo', code: 'stock:list-shared-inventory-pool' })
  async listSharedInventoryPool(@Body() query: ListSharedInventoryPoolDto) {
    const { rows, total } = await this.sysStockService.listSharedInventoryPool(query)
    return ResultData.list(rows, total)
  }

  @Post('remove-shared-inventory-pool')
  @ApiOperation({ summary: '解除SKU的共享库存池关系' })
  @ApiResult(Boolean)
  @Permission({ group: '库存管理', name: '解除共享库存池关系', model: 'YunCangStockInfo', code: 'stock:remove-shared-inventory-pool' })
  async removeSharedInventoryPool(@Body() dto: RemoveSharedInventoryPoolDto) {
    const result = await this.sysStockService.removeSharedInventoryPool(dto)
    return ResultData.ok(result)
  }
}
