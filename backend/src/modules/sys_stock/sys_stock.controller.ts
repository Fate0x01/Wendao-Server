import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import { GetFile, UseFileUpload } from 'src/common/decorators/upload-kit'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { JingCangStockQueryDto } from './dto/jing-cang-stock-query.dto'
import { SetReorderThresholdDto } from './dto/set-reorder-threshold.dto'
import { JingCangStockGroupEntity } from './entities/jing-cang-stock-group.entity'
import { JingCangStockInfoEntity } from './entities/jing-cang-stock-info.entity'
import { JingCangStockStatisticsEntity } from './entities/jing-cang-stock-statistics.entity'
import { StockImportResultEntity } from './entities/stock-import-result.entity'
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
  @Permission({ group: '库存管理', name: '统计京仓库存信息', model: 'JingCangStockInfo', code: 'stock:statistics-jing-cang-stock' })
  async statisticsJingCangStock(@Body() query: JingCangStockQueryDto) {
    const statistics = await this.sysStockService.getJingCangStockStatistics(query)
    return ResultData.ok(statistics)
  }

  @Post('set-reorder-threshold')
  @ApiOperation({ summary: '设置补货预警阈值' })
  @ApiResult(JingCangStockInfoEntity)
  @Permission({ group: '库存管理', name: '设置补货预警阈值', model: 'JingCangStockInfo', code: 'stock:set-reorder-threshold' })
  async setReorderThreshold(@Body() dto: SetReorderThresholdDto) {
    const stockInfo = await this.sysStockService.setReorderThreshold(dto)
    return ResultData.ok(stockInfo)
  }
}
