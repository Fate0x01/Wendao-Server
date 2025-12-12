import { accessibleBy } from '@casl/prisma'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { ExcelResult } from 'src/common/decorators/export-kit'
import defineAbilityFor from 'src/shared/casl/casl-ability.factory'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import * as xlsx from 'xlsx'
import { ReqUser } from '../sys_auth/types/request'
import { InventoryPoolInfoQueryDto } from './dto/inventory-pool-info-query.dto'
import { JingCangStockQueryDto } from './dto/jing-cang-stock-query.dto'
import { PurchaseOrderConfirmDto } from './dto/purchase-order-confirm.dto'
import { PurchaseOrderCreateDto } from './dto/purchase-order-create.dto'
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto'
import { PurchaseOrderUpdateDto } from './dto/purchase-order-update.dto'
import { SetReorderThresholdDto } from './dto/set-reorder-threshold.dto'
import { SetYunCangReorderThresholdDto } from './dto/set-yun-cang-reorder-threshold.dto'
import { YunCangStockQueryDto } from './dto/yun-cang-stock-query.dto'
import { InventoryPoolInfoEntity } from './entities/inventory-pool-info.entity'
import { PurchaseDetailEntity } from './entities/purchase-detail.entity'
import { PurchaseOrderEntity } from './entities/purchase-order.entity'
import { YunCangStockGroupEntity } from './entities/yun-cang-stock-group.entity'
import { YunCangStockStatisticsEntity } from './entities/yun-cang-stock-statistics.entity'

@Injectable()
export class SysStockService {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
  ) {}

  /**
   * 确保云仓库存记录存在，如果不存在则创建
   * @param goodId 商品ID
   * @param ability CASL权限能力
   * @returns 库存记录ID
   */
  private async ensureYunCangStockInfoExists(goodId: string, ability: any): Promise<string> {
    // 先检查商品是否存在且有权限
    const good = await this.prisma.goods.findFirst({
      where: { AND: [{ id: goodId }, accessibleBy(ability).Goods] },
      select: { id: true },
    })
    if (!good) {
      throw new NotFoundException('商品不存在或无权操作')
    }

    // 检查库存记录是否存在
    let stockInfo = await this.prisma.yunCangStockInfo.findUnique({
      where: { goodId },
      select: { id: true },
    })

    // 如果不存在，则创建
    if (!stockInfo) {
      stockInfo = await this.prisma.yunCangStockInfo.create({
        data: {
          goodId,
          dailySalesQuantity: 0,
          monthlySalesQuantity: 0,
          reorderThreshold: 10,
          sluggishDays: 0,
        },
        select: { id: true },
      })
    }

    return stockInfo.id
  }

  /**
   * 导入京仓库存信息
   * @param file Excel文件
   */
  async importJingCangStock(file: Express.Multer.File) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 解析 Excel
    const workbook = xlsx.read(file.buffer, { type: 'buffer' })
    if (!workbook.SheetNames.length) {
      throw new BadRequestException('Excel 文件为空')
    }
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(sheet)
    if (!rawData.length) {
      throw new BadRequestException('Excel 数据为空')
    }

    // 2. 检测列名类型（SKU 或 京东SKU）
    const firstRow: any = rawData[0]
    const hasSkuColumn = 'SKU' in firstRow
    const hasJingDongSkuColumn = '京东SKU' in firstRow

    if (!hasSkuColumn && !hasJingDongSkuColumn) {
      throw new BadRequestException('Excel 中必须包含 "SKU" 或 "京东SKU" 列')
    }

    // 3. 批量加载所有商品和映射关系（优化性能）
    const allGoods = await this.prisma.goods.findMany({
      where: { AND: [accessibleBy(ability).Goods] },
      select: { id: true, sku: true },
    })
    const goodsMapBySku = new Map<string, string>()
    for (const good of allGoods) {
      goodsMapBySku.set(good.sku, good.id)
    }

    let emgSkuMappingMap: Map<string, string> | null = null
    if (hasJingDongSkuColumn) {
      const allMappings = await this.prisma.emgSkuMapping.findMany({
        select: { emgSku: true, sku: true },
      })
      emgSkuMappingMap = new Map<string, string>()
      for (const mapping of allMappings) {
        emgSkuMappingMap.set(mapping.emgSku, mapping.sku)
      }
    }

    // 4. 处理数据并执行 upsert
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i]
      try {
        // 获取 SKU（直接或通过京东SKU映射）
        let sku: string
        if (hasSkuColumn) {
          const skuVal = row['SKU']
          if (!skuVal || String(skuVal).trim() === '') {
            throw new Error('SKU 不能为空')
          }
          sku = String(skuVal).trim()
        } else if (hasJingDongSkuColumn) {
          const jingDongSkuVal = row['京东SKU']
          if (!jingDongSkuVal || String(jingDongSkuVal).trim() === '') {
            throw new Error('京东SKU 不能为空')
          }
          const jingDongSku = String(jingDongSkuVal).trim()
          const mappedSku = emgSkuMappingMap?.get(jingDongSku)
          if (!mappedSku) {
            throw new Error(`京东SKU "${jingDongSku}" 未找到对应的 SKU 映射`)
          }
          sku = mappedSku
        } else {
          throw new Error('无法确定 SKU 列')
        }

        // 查询商品ID
        const goodId = goodsMapBySku.get(sku)
        if (!goodId) {
          throw new Error(`SKU "${sku}" 对应的商品不存在`)
        }

        // 获取仓库名称并提取前两个字
        const warehouseName = row['仓库名称']
        if (!warehouseName || String(warehouseName).trim() === '') {
          throw new Error('仓库名称不能为空')
        }
        const warehouseNameStr = String(warehouseName).trim()
        const warehouse = warehouseNameStr.length >= 2 ? warehouseNameStr.substring(0, 2) : warehouseNameStr
        if (warehouse === '全国') {
          // 表格内可能存在冗余数据，需要进行跳过
          continue
        }

        // 获取其他字段
        const stockQuantity = row['在库件数'] !== undefined && row['在库件数'] !== '' ? Number(row['在库件数']) : null
        const dailySalesQuantity = row['销售出库件数'] !== undefined && row['销售出库件数'] !== '' ? Number(row['销售出库件数']) : null
        const monthlySalesQuantity = row['近30日出库商品件数'] !== undefined && row['近30日出库商品件数'] !== '' ? Number(row['近30日出库商品件数']) : row['近30天销售出库件数'] !== undefined && row['近30天销售出库件数'] !== '' ? Number(row['近30天销售出库件数']) : null

        // 验证必填字段
        if (stockQuantity === null || isNaN(stockQuantity)) {
          throw new Error('在库件数不能为空且必须为数字')
        }
        if (dailySalesQuantity === null || isNaN(dailySalesQuantity)) {
          throw new Error('销售出库件数不能为空且必须为数字')
        }
        if (monthlySalesQuantity === null || isNaN(monthlySalesQuantity)) {
          throw new Error('近30日出库商品件数/近30天销售出库件数不能为空且必须为数字')
        }

        // 查询现有记录以获取当前的滞销天数
        const existingStock = await this.prisma.jingCangStockInfo.findUnique({
          where: {
            goodId_warehouse: {
              goodId,
              warehouse,
            },
          },
        })

        // 计算滞销天数
        const finalStockQuantity = Math.floor(stockQuantity)
        const finalDailySalesQuantity = Math.floor(dailySalesQuantity)
        let newSluggishDays = 0
        if (finalStockQuantity > 0 && finalDailySalesQuantity === 0) {
          newSluggishDays = existingStock ? existingStock.sluggishDays + 1 : 1 // 库存大于 0 且日销量为 0，滞销天数递增
        } else if (finalDailySalesQuantity > 0) {
          newSluggishDays = 0 // 日销量大于 0，滞销天数重置
        } else {
          newSluggishDays = 0 // 库存为 0 时，滞销天数重置
        }

        // 执行 upsert（基于 goodId 和 warehouse 的唯一约束）
        await this.prisma.jingCangStockInfo.upsert({
          where: {
            goodId_warehouse: {
              goodId,
              warehouse,
            },
          },
          update: {
            stockQuantity: finalStockQuantity,
            dailySalesQuantity: finalDailySalesQuantity,
            monthlySalesQuantity: Math.floor(monthlySalesQuantity),
            sluggishDays: newSluggishDays,
          },
          create: {
            goodId,
            warehouse,
            stockQuantity: finalStockQuantity,
            dailySalesQuantity: finalDailySalesQuantity,
            monthlySalesQuantity: Math.floor(monthlySalesQuantity),
            sluggishDays: newSluggishDays,
          },
        })

        successCount++
      } catch (error) {
        failCount++
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`第 ${i + 2} 行导入失败: ${errorMsg}`)
      }
    }

    return {
      success: successCount,
      fail: failCount,
      errors: errors.slice(0, 20),
    }
  }

  /**
   * 查询京仓库存信息列表（按商品分组）
   * @param query 查询参数
   * @returns 按商品分组的库存信息列表和总数
   */
  async listJingCangStock(query: JingCangStockQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 先查询有库存信息的商品ID列表（用于统计总数和分页）
    // 注意：这里不应用 warehouse 筛选，因为需要在所有库存记录上判断是否达到预警或滞销
    const allStockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {},
      select: {
        goodId: true,
        stockQuantity: true,
        reorderThreshold: true,
        warehouse: true,
        sluggishDays: true,
      },
    })

    // 如果筛选是否达到补货预警或滞销产品，需要过滤出符合条件的商品
    let filteredGoodIds: string[]

    // 先处理补货预警筛选
    let afterLowStockFilter: typeof allStockInfos = allStockInfos
    if (query.isLowStock === true) {
      // 只返回至少有一个库存记录达到预警的商品（stockQuantity <= reorderThreshold）
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      const lowStockGoodIds = new Set(filteredInfos.filter((info) => info.stockQuantity <= info.reorderThreshold).map((info) => info.goodId))
      afterLowStockFilter = allStockInfos.filter((info) => lowStockGoodIds.has(info.goodId))
    } else if (query.isLowStock === false) {
      // 只返回所有库存记录都未达到预警的商品（所有库存记录都 stockQuantity > reorderThreshold）
      // 按商品分组，判断每个商品是否所有库存记录都未达到预警
      const goodStockMap = new Map<string, Array<{ stockQuantity: number; reorderThreshold: number; warehouse: string }>>()
      for (const info of allStockInfos) {
        if (!goodStockMap.has(info.goodId)) {
          goodStockMap.set(info.goodId, [])
        }
        goodStockMap.get(info.goodId)!.push({
          stockQuantity: info.stockQuantity,
          reorderThreshold: info.reorderThreshold,
          warehouse: info.warehouse,
        })
      }

      // 找出所有库存记录都未达到预警的商品
      const notLowStockGoodIds: string[] = []
      for (const [goodId, stockList] of goodStockMap.entries()) {
        // 如果指定了 warehouse，只检查该 warehouse 的库存记录
        const checkList = query.warehouse ? stockList.filter((s) => s.warehouse === query.warehouse) : stockList
        // 如果该商品在指定 warehouse 下没有库存记录，跳过
        if (checkList.length === 0) continue
        // 检查是否所有库存记录都未达到预警
        const allNotLowStock = checkList.every((s) => s.stockQuantity > s.reorderThreshold)
        if (allNotLowStock) {
          notLowStockGoodIds.push(goodId)
        }
      }
      afterLowStockFilter = allStockInfos.filter((info) => notLowStockGoodIds.includes(info.goodId))
    }

    // 再处理滞销产品筛选
    if (query.isSluggish === true) {
      // 只返回至少有一个库存记录的滞销天数 > 7 的商品
      const filteredInfos = query.warehouse ? afterLowStockFilter.filter((info) => info.warehouse === query.warehouse) : afterLowStockFilter
      const sluggishGoodIds = new Set(filteredInfos.filter((info) => info.sluggishDays > 7).map((info) => info.goodId))
      filteredGoodIds = Array.from(sluggishGoodIds)
    } else if (query.isSluggish === false) {
      // 只返回所有库存记录的滞销天数都 <= 7 的商品
      const goodStockMap = new Map<string, Array<{ sluggishDays: number; warehouse: string }>>()
      for (const info of afterLowStockFilter) {
        if (!goodStockMap.has(info.goodId)) {
          goodStockMap.set(info.goodId, [])
        }
        goodStockMap.get(info.goodId)!.push({
          sluggishDays: info.sluggishDays,
          warehouse: info.warehouse,
        })
      }

      const notSluggishGoodIds: string[] = []
      for (const [goodId, stockList] of goodStockMap.entries()) {
        const checkList = query.warehouse ? stockList.filter((s) => s.warehouse === query.warehouse) : stockList
        if (checkList.length === 0) continue
        const allNotSluggish = checkList.every((s) => s.sluggishDays <= 7)
        if (allNotSluggish) {
          notSluggishGoodIds.push(goodId)
        }
      }
      filteredGoodIds = notSluggishGoodIds
    } else {
      // 未传参，返回所有商品
      const filteredInfos = query.warehouse ? afterLowStockFilter.filter((info) => info.warehouse === query.warehouse) : afterLowStockFilter
      filteredGoodIds = Array.from(new Set(filteredInfos.map((info) => info.goodId)))
    }

    const distinctGoodIds = filteredGoodIds

    // 2. 查询所有符合条件的商品（不分页，用于计算统计信息和排序）
    // 注意：如果筛选了 isLowStock，distinctGoodIds 已经包含了过滤后的商品ID
    const allGoods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            id: { in: distinctGoodIds },
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
        sku: true,
        departmentName: true,
        shopName: true,
        responsiblePerson: true,
        shelfNumber: true,
        imageUrl: true,
        inboundBarcode: true,
        spec: true,
        purchaseCost: true,
      },
    })

    // 查询符合条件的商品总数
    const totalGoods = allGoods.length

    // 3. 批量查询这些商品的库存信息（返回所有库存信息，不进行过滤）
    const goodIds = allGoods.map((good) => good.id)
    const stockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
        warehouse: query.warehouse || undefined,
      },
      orderBy: { warehouse: 'asc' },
    })

    // 4. 按商品分组并计算统计信息
    const goodsMap = new Map<
      string,
      {
        goodId: string
        departmentName: string
        shopName: string | null
        sku: string
        responsiblePerson: string | null
        shelfNumber: string | null
        imageUrl: string | null
        inboundBarcode: string | null
        spec: string | null
        purchaseCost: number | null
        stockInfos: Array<{
          id: string
          warehouse: string
          stockQuantity: number
          dailySalesQuantity: number
          monthlySalesQuantity: number
          reorderThreshold: number
          sluggishDays: number
          createdAt: Date
          updatedAt: Date
        }>
      }
    >()

    // 初始化商品分组
    for (const good of allGoods) {
      goodsMap.set(good.id, {
        goodId: good.id,
        departmentName: good.departmentName,
        shopName: good.shopName,
        sku: good.sku,
        responsiblePerson: good.responsiblePerson,
        shelfNumber: good.shelfNumber,
        imageUrl: good.imageUrl,
        inboundBarcode: good.inboundBarcode,
        spec: good.spec,
        purchaseCost: good.purchaseCost ? Number(good.purchaseCost) : null,
        stockInfos: [],
      })
    }

    // 填充库存信息
    for (const stockInfo of stockInfos) {
      const goodGroup = goodsMap.get(stockInfo.goodId)
      if (goodGroup) {
        // 根据筛选条件决定是否添加库存记录
        let shouldAdd = true

        if (query.isLowStock === true) {
          // 只添加达到预警的库存记录（stockQuantity <= reorderThreshold）
          shouldAdd = stockInfo.stockQuantity <= stockInfo.reorderThreshold
        } else if (query.isLowStock === false) {
          // 只添加未达到预警的库存记录（stockQuantity > reorderThreshold）
          shouldAdd = stockInfo.stockQuantity > stockInfo.reorderThreshold
        }

        if (query.isSluggish === true) {
          // 只添加滞销天数 > 7 的库存记录
          shouldAdd = shouldAdd && stockInfo.sluggishDays > 7
        } else if (query.isSluggish === false) {
          // 只添加滞销天数 <= 7 的库存记录
          shouldAdd = shouldAdd && stockInfo.sluggishDays <= 7
        }

        if (shouldAdd) {
          goodGroup.stockInfos.push({
            id: stockInfo.id,
            warehouse: stockInfo.warehouse,
            stockQuantity: stockInfo.stockQuantity,
            dailySalesQuantity: stockInfo.dailySalesQuantity,
            monthlySalesQuantity: stockInfo.monthlySalesQuantity,
            reorderThreshold: stockInfo.reorderThreshold,
            sluggishDays: stockInfo.sluggishDays,
            createdAt: stockInfo.createdAt,
            updatedAt: stockInfo.updatedAt,
          })
        }
      }
    }

    // 5. 转换为数组并计算统计信息，过滤掉没有库存信息的商品（当筛选时）
    let rows = Array.from(goodsMap.values())
      .filter((group) => {
        // 如果筛选了 isLowStock 或 isSluggish，过滤掉没有符合条件库存记录的商品
        if (query.isLowStock === true || query.isLowStock === false || query.isSluggish === true || query.isSluggish === false) {
          return group.stockInfos.length > 0
        }
        return true
      })
      .map((group) => {
        const totalStockQuantity = group.stockInfos.reduce((sum, info) => sum + info.stockQuantity, 0)
        const totalDailySalesQuantity = group.stockInfos.reduce((sum, info) => sum + info.dailySalesQuantity, 0)
        const totalMonthlySalesQuantity = group.stockInfos.reduce((sum, info) => sum + info.monthlySalesQuantity, 0)
        const totalPurchaseCostValue = group.purchaseCost !== null ? group.stockInfos.reduce((sum, info) => sum + info.stockQuantity * group.purchaseCost, 0) : null

        return {
          goodId: group.goodId,
          departmentName: group.departmentName,
          shopName: group.shopName,
          sku: group.sku,
          responsiblePerson: group.responsiblePerson,
          shelfNumber: group.shelfNumber,
          imageUrl: group.imageUrl,
          inboundBarcode: group.inboundBarcode,
          spec: group.spec,
          purchaseCost: group.purchaseCost,
          stockInfos: group.stockInfos,
          totalStockQuantity,
          totalDailySalesQuantity,
          totalMonthlySalesQuantity,
          totalPurchaseCostValue,
        }
      })

    // 6. 根据排序字段和排序方向进行排序
    if (query.sortField && query.sortOrder) {
      rows.sort((a, b) => {
        let aValue: number
        let bValue: number

        switch (query.sortField) {
          case 'totalStockQuantity':
            aValue = a.totalStockQuantity
            bValue = b.totalStockQuantity
            break
          case 'totalDailySalesQuantity':
            aValue = a.totalDailySalesQuantity
            bValue = b.totalDailySalesQuantity
            break
          case 'totalMonthlySalesQuantity':
            aValue = a.totalMonthlySalesQuantity
            bValue = b.totalMonthlySalesQuantity
            break
          case 'totalPurchaseCostValue':
            // 处理 null 值，null 值排在最后
            aValue = a.totalPurchaseCostValue ?? -Infinity
            bValue = b.totalPurchaseCostValue ?? -Infinity
            break
          default:
            return 0
        }

        if (aValue === bValue) return 0
        const comparison = aValue > bValue ? 1 : -1
        return query.sortOrder === 'asc' ? comparison : -comparison
      })
    }

    // 7. 分页处理
    const startIndex = (query.current - 1) * query.pageSize
    const endIndex = startIndex + query.pageSize
    const paginatedRows = rows.slice(startIndex, endIndex)

    return { rows: paginatedRows, total: rows.length }
  }

  /**
   * 统计京仓库存信息
   * @param query 查询参数
   * @returns 统计数据（总日销量、总月销量、进货成本总货值）
   */
  async getJingCangStockStatistics(query: JingCangStockQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 先查询有库存信息的商品ID列表（用于过滤）
    const allStockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {},
      select: {
        goodId: true,
        stockQuantity: true,
        reorderThreshold: true,
        warehouse: true,
      },
    })

    // 如果筛选是否达到补货预警，需要过滤出符合条件的商品
    let filteredGoodIds: string[]
    if (query.isLowStock === true) {
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      const lowStockGoodIds = new Set(filteredInfos.filter((info) => info.stockQuantity <= info.reorderThreshold).map((info) => info.goodId))
      filteredGoodIds = Array.from(lowStockGoodIds)
    } else if (query.isLowStock === false) {
      const goodStockMap = new Map<string, Array<{ stockQuantity: number; reorderThreshold: number; warehouse: string }>>()
      for (const info of allStockInfos) {
        if (!goodStockMap.has(info.goodId)) {
          goodStockMap.set(info.goodId, [])
        }
        goodStockMap.get(info.goodId)!.push({
          stockQuantity: info.stockQuantity,
          reorderThreshold: info.reorderThreshold,
          warehouse: info.warehouse,
        })
      }

      const notLowStockGoodIds: string[] = []
      for (const [goodId, stockList] of goodStockMap.entries()) {
        const checkList = query.warehouse ? stockList.filter((s) => s.warehouse === query.warehouse) : stockList
        if (checkList.length === 0) continue
        const allNotLowStock = checkList.every((s) => s.stockQuantity > s.reorderThreshold)
        if (allNotLowStock) {
          notLowStockGoodIds.push(goodId)
        }
      }
      filteredGoodIds = notLowStockGoodIds
    } else {
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      filteredGoodIds = Array.from(new Set(filteredInfos.map((info) => info.goodId)))
    }

    // 2. 查询所有符合条件的商品（不分页，用于统计）
    const goods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            id: { in: filteredGoodIds },
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
        purchaseCost: true,
      },
    })

    const goodIds = goods.map((good) => good.id)
    const goodsPurchaseCostMap = new Map<string, number>()
    for (const good of goods) {
      if (good.purchaseCost !== null) {
        goodsPurchaseCostMap.set(good.id, Number(good.purchaseCost))
      }
    }

    // 3. 查询这些商品的库存信息
    const stockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
        warehouse: query.warehouse || undefined,
      },
    })

    // 4. 根据筛选条件过滤库存信息并计算统计值
    let totalDailySalesQuantity = 0
    let totalMonthlySalesQuantity = 0
    let totalPurchaseCostValue = 0

    for (const stockInfo of stockInfos) {
      // 根据 isLowStock 筛选条件决定是否计入统计
      let shouldInclude = true
      if (query.isLowStock === true) {
        shouldInclude = stockInfo.stockQuantity <= stockInfo.reorderThreshold
      } else if (query.isLowStock === false) {
        shouldInclude = stockInfo.stockQuantity > stockInfo.reorderThreshold
      }

      if (shouldInclude) {
        totalDailySalesQuantity += stockInfo.dailySalesQuantity
        totalMonthlySalesQuantity += stockInfo.monthlySalesQuantity

        const purchaseCost = goodsPurchaseCostMap.get(stockInfo.goodId)
        if (purchaseCost !== undefined) {
          totalPurchaseCostValue += purchaseCost * stockInfo.stockQuantity
        }
      }
    }

    return {
      totalDailySalesQuantity,
      totalMonthlySalesQuantity,
      totalPurchaseCostValue,
    }
  }

  /**
   * 查询云仓库存信息列表
   * @param query 查询参数
   * @returns 云仓库存列表和总数
   */
  async listYunCangStock(query: YunCangStockQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 先查询所有符合条件的商品（基于商品信息）
    const allGoods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
        departmentName: true,
        shopName: true,
        sku: true,
        responsiblePerson: true,
        shelfNumber: true,
        imageUrl: true,
        inboundBarcode: true,
        spec: true,
      },
    })

    const goodIds = allGoods.map((good) => good.id)

    // 2. 批量查询这些商品的库存信息
    const stockInfos = await this.prisma.yunCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
      },
      select: {
        goodId: true,
        dailySalesQuantity: true,
        monthlySalesQuantity: true,
        reorderThreshold: true,
        sluggishDays: true,
        createdAt: true,
        yunCangInventoryPool: { select: { quantity: true } },
      },
    })

    // 3. 构建库存信息映射
    const stockInfoMap = new Map(
      stockInfos.map((info) => [
        info.goodId,
        {
          dailySalesQuantity: info.dailySalesQuantity,
          monthlySalesQuantity: info.monthlySalesQuantity,
          reorderThreshold: info.reorderThreshold,
          sluggishDays: info.sluggishDays,
          actualQuantity: info.yunCangInventoryPool?.quantity ?? 0,
          createdAt: info.createdAt,
        },
      ]),
    )

    // 4. 合并商品信息和库存信息
    let rows = allGoods.map((good) => {
      const stockInfo = stockInfoMap.get(good.id)
      return {
        goodId: good.id,
        departmentName: good.departmentName,
        shopName: good.shopName,
        sku: good.sku,
        responsiblePerson: good.responsiblePerson,
        shelfNumber: good.shelfNumber,
        imageUrl: good.imageUrl,
        inboundBarcode: good.inboundBarcode,
        spec: good.spec,
        dailySalesQuantity: stockInfo?.dailySalesQuantity ?? 0,
        monthlySalesQuantity: stockInfo?.monthlySalesQuantity ?? 0,
        reorderThreshold: stockInfo?.reorderThreshold ?? 10,
        sluggishDays: stockInfo?.sluggishDays ?? 0,
        actualQuantity: stockInfo?.actualQuantity ?? 0,
        createdAt: stockInfo?.createdAt ?? new Date(),
      }
    })

    // 5. 应用筛选条件
    if (query.isLowStock === true) {
      rows = rows.filter((row) => row.actualQuantity <= row.reorderThreshold)
    } else if (query.isLowStock === false) {
      rows = rows.filter((row) => row.actualQuantity > row.reorderThreshold)
    }

    if (query.isSluggish === true) {
      rows = rows.filter((row) => row.sluggishDays > 7)
    } else if (query.isSluggish === false) {
      rows = rows.filter((row) => row.sluggishDays <= 7)
    }

    // 6. 排序
    if (query.sortField) {
      const order = query.sortOrder === 'asc' ? 1 : -1
      rows.sort((a, b) => {
        const aValue = a[query.sortField!]
        const bValue = b[query.sortField!]
        if (aValue === bValue) return 0
        return aValue > bValue ? order : -order
      })
    } else {
      rows.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    }

    // 7. 分页
    const startIndex = (query.current - 1) * query.pageSize
    const endIndex = startIndex + query.pageSize
    const pagedRows = rows.slice(startIndex, endIndex).map((row) => {
      const { createdAt, ...rest } = row
      return rest
    })

    return { rows: pagedRows as unknown as YunCangStockGroupEntity[], total: rows.length }
  }

  /**
   * 统计云仓库存信息
   * @param query 查询参数
   * @returns 统计数据
   */
  async statisticsYunCangStock(query: YunCangStockQueryDto): Promise<YunCangStockStatisticsEntity> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 先查询所有符合条件的商品（基于商品信息）
    const allGoods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
      },
    })

    const goodIds = allGoods.map((good) => good.id)

    // 2. 批量查询这些商品的库存信息
    const stockInfos = await this.prisma.yunCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
      },
      select: {
        goodId: true,
        dailySalesQuantity: true,
        monthlySalesQuantity: true,
        reorderThreshold: true,
        sluggishDays: true,
        yunCangInventoryPool: { select: { quantity: true } },
      },
    })

    // 3. 构建库存信息映射
    const stockInfoMap = new Map(
      stockInfos.map((info) => [
        info.goodId,
        {
          dailySalesQuantity: info.dailySalesQuantity,
          monthlySalesQuantity: info.monthlySalesQuantity,
          reorderThreshold: info.reorderThreshold,
          sluggishDays: info.sluggishDays,
          actualQuantity: info.yunCangInventoryPool?.quantity ?? 0,
        },
      ]),
    )

    // 4. 合并商品信息和库存信息
    let rows = allGoods.map((good) => {
      const stockInfo = stockInfoMap.get(good.id)
      return {
        actualQuantity: stockInfo?.actualQuantity ?? 0,
        dailySalesQuantity: stockInfo?.dailySalesQuantity ?? 0,
        monthlySalesQuantity: stockInfo?.monthlySalesQuantity ?? 0,
        reorderThreshold: stockInfo?.reorderThreshold ?? 10,
        sluggishDays: stockInfo?.sluggishDays ?? 0,
      }
    })

    // 5. 应用筛选条件
    if (query.isLowStock === true) {
      rows = rows.filter((row) => row.actualQuantity <= row.reorderThreshold)
    } else if (query.isLowStock === false) {
      rows = rows.filter((row) => row.actualQuantity > row.reorderThreshold)
    }

    if (query.isSluggish === true) {
      rows = rows.filter((row) => row.sluggishDays > 7)
    } else if (query.isSluggish === false) {
      rows = rows.filter((row) => row.sluggishDays <= 7)
    }

    // 6. 计算统计数据
    const totalStockQuantity = rows.reduce((sum, row) => sum + row.actualQuantity, 0)
    const totalDailySalesQuantity = rows.reduce((sum, row) => sum + row.dailySalesQuantity, 0)
    const totalMonthlySalesQuantity = rows.reduce((sum, row) => sum + row.monthlySalesQuantity, 0)

    return {
      totalStockQuantity,
      totalDailySalesQuantity,
      totalMonthlySalesQuantity,
    }
  }

  /**
   * 设置云仓补货预警阈值
   * @param dto 设置参数
   * @returns 更新后的库存信息
   */
  async setYunCangReorderThreshold(dto: SetYunCangReorderThresholdDto): Promise<YunCangStockGroupEntity> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 确保库存记录存在
    await this.ensureYunCangStockInfoExists(dto.goodId, ability)

    const updated = await this.prisma.yunCangStockInfo.update({
      where: { goodId: dto.goodId },
      data: { reorderThreshold: dto.reorderThreshold },
      select: {
        goodId: true,
        dailySalesQuantity: true,
        monthlySalesQuantity: true,
        reorderThreshold: true,
        sluggishDays: true,
        createdAt: true,
        yunCangInventoryPool: { select: { quantity: true } },
        good: {
          select: {
            departmentName: true,
            shopName: true,
            sku: true,
            responsiblePerson: true,
            shelfNumber: true,
            imageUrl: true,
            inboundBarcode: true,
            spec: true,
          },
        },
      },
    })

    const actualQuantity = updated.yunCangInventoryPool?.quantity ?? 0

    return {
      goodId: updated.goodId,
      departmentName: updated.good.departmentName,
      shopName: updated.good.shopName,
      sku: updated.good.sku,
      responsiblePerson: updated.good.responsiblePerson,
      shelfNumber: updated.good.shelfNumber,
      imageUrl: updated.good.imageUrl,
      inboundBarcode: updated.good.inboundBarcode,
      spec: updated.good.spec,
      dailySalesQuantity: updated.dailySalesQuantity,
      monthlySalesQuantity: updated.monthlySalesQuantity,
      reorderThreshold: updated.reorderThreshold,
      sluggishDays: updated.sluggishDays,
      actualQuantity,
    }
  }

  /**
   * 查询云仓库存池信息
   * @param query 查询参数
   * @returns 库存池详情
   */
  async getYunCangInventoryPoolInfo(query: InventoryPoolInfoQueryDto): Promise<InventoryPoolInfoEntity> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 确保库存记录存在
    await this.ensureYunCangStockInfoExists(query.goodId, ability)

    const stockInfo = await this.prisma.yunCangStockInfo.findUnique({
      where: { goodId: query.goodId },
      include: { yunCangInventoryPool: { include: { stockInfos: { include: { good: true } } } }, good: true },
    })
    if (!stockInfo) {
      throw new NotFoundException('云仓库存不存在')
    }

    const pool = stockInfo.yunCangInventoryPool
    const sharedGoods =
      pool?.stockInfos
        ?.filter((s) => s.goodId !== stockInfo.goodId)
        .map((s) => ({
          goodId: s.goodId,
          sku: s.good.sku,
        })) ?? []
    const actualQuantity = pool?.quantity ?? 0
    const isIndependent = pool ? pool.stockInfos.length <= 1 : true

    return {
      goodId: stockInfo.goodId,
      sku: stockInfo.good.sku,
      departmentName: stockInfo.good.departmentName,
      yunCangInventoryPoolId: pool?.id ?? null,
      actualQuantity,
      isIndependent,
      sharedGoods,
    }
  }

  /**
   * 创建采购订单
   * @param dto 创建参数
   * @returns 采购订单
   */
  async createPurchaseOrder(dto: PurchaseOrderCreateDto): Promise<PurchaseOrderEntity> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const exists = await this.prisma.purchaseOrder.findUnique({ where: { purchaseBatchNumber: dto.purchaseBatchNumber } })
    if (exists) {
      throw new BadRequestException('采购批次号已存在')
    }

    const skus = dto.purchaseDetails.map((d) => d.sku)
    const goods = await this.prisma.goods.findMany({
      where: { sku: { in: skus }, AND: [accessibleBy(ability).Goods] },
      select: { id: true, sku: true },
    })
    if (goods.length !== skus.length) {
      throw new NotFoundException('存在无权操作的商品或SKU不存在')
    }

    const goodsMap = new Map(goods.map((g) => [g.sku, g.id]))

    const created = await this.prisma.purchaseOrder.create({
      data: {
        purchaseBatchNumber: dto.purchaseBatchNumber,
        purchaseDetails: {
          createMany: {
            data: dto.purchaseDetails.map((d) => ({
              goodId: goodsMap.get(d.sku)!,
              quantity: d.quantity,
              purchaseAmount: d.purchaseAmount,
              purchaseOrderNumber: d.purchaseOrderNumber,
              expressNo: d.expressNo,
            })),
          },
        },
      },
      include: {
        purchaseDetails: {
          include: {
            good: { select: { sku: true } },
          },
        },
      },
    })

    return this.mapPurchaseOrder(created)
  }

  /**
   * 查询采购订单
   * @param query 查询参数
   * @returns 订单列表
   */
  async listPurchaseOrder(query: PurchaseOrderQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const accessibleGoods = await this.prisma.goods.findMany({
      where: { AND: [accessibleBy(ability).Goods], departmentId: query.departmentId || undefined },
      select: { id: true },
    })
    const accessibleGoodIds = accessibleGoods.map((g) => g.id)
    if (!accessibleGoodIds.length) {
      return { rows: [], total: 0 }
    }

    const { rows, total } = await this.nestPrisma.client.purchaseOrder.findAndCount({
      where: {
        purchaseBatchNumber: query.purchaseBatchNumber ? { contains: query.purchaseBatchNumber } : undefined,
        departmentConfirmStatus: query.departmentConfirmStatus,
        financeConfirmStatus: query.financeConfirmStatus,
        createdAt: query.createdAtStart || query.createdAtEnd ? { gte: query.createdAtStart, lte: query.createdAtEnd } : undefined,
        purchaseDetails: { some: { goodId: { in: accessibleGoodIds } } },
      },
      include: {
        purchaseDetails: {
          include: { good: { select: { sku: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
    })

    return { rows: rows.map((row) => this.mapPurchaseOrder(row)), total }
  }

  /**
   * 更新采购订单
   * @param dto 更新参数
   * @returns 更新后的订单
   */
  async updatePurchaseOrder(dto: PurchaseOrderUpdateDto): Promise<PurchaseOrderEntity> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const existed = await this.prisma.purchaseOrder.findFirst({
      where: { AND: [{ id: dto.id }, accessibleBy(ability).PurchaseOrder] },
      include: { purchaseDetails: true },
    })
    if (!existed) {
      throw new NotFoundException('采购订单不存在或无权操作')
    }

    if (dto.purchaseBatchNumber && dto.purchaseBatchNumber !== existed.purchaseBatchNumber) {
      const duplicate = await this.prisma.purchaseOrder.findUnique({ where: { purchaseBatchNumber: dto.purchaseBatchNumber } })
      if (duplicate) {
        throw new BadRequestException('采购批次号已存在')
      }
    }

    if (existed.departmentConfirmStatus && dto.purchaseDetails) {
      throw new BadRequestException('部门已确认，无法修改采购详情')
    }

    if (dto.purchaseDetails) {
      const skus = dto.purchaseDetails.map((d) => d.sku)
      const goods = await this.prisma.goods.findMany({
        where: { sku: { in: skus }, AND: [accessibleBy(ability).Goods] },
        select: { id: true, sku: true },
      })
      if (goods.length !== skus.length) {
        throw new NotFoundException('存在无权操作的商品或SKU不存在')
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id: dto.id },
        data: {
          purchaseBatchNumber: dto.purchaseBatchNumber ?? existed.purchaseBatchNumber,
        },
      })

      if (dto.purchaseDetails) {
        const skus = dto.purchaseDetails.map((d) => d.sku)
        const goods = await tx.goods.findMany({
          where: { sku: { in: skus }, AND: [accessibleBy(ability).Goods] },
          select: { id: true, sku: true },
        })
        const goodsMap = new Map(goods.map((g) => [g.sku, g.id]))

        await tx.purchaseDetail.deleteMany({ where: { purchaseOrderId: dto.id } })
        await tx.purchaseDetail.createMany({
          data: dto.purchaseDetails.map((d) => ({
            purchaseOrderId: dto.id,
            goodId: goodsMap.get(d.sku)!,
            quantity: d.quantity,
            purchaseAmount: d.purchaseAmount,
            purchaseOrderNumber: d.purchaseOrderNumber,
            expressNo: d.expressNo,
          })),
        })
      }

      return order
    })

    const result = await this.prisma.purchaseOrder.findUnique({
      where: { id: updated.id },
      include: { purchaseDetails: { include: { good: { select: { sku: true } } } } },
    })

    return this.mapPurchaseOrder(result!)
  }

  /**
   * 部门确认采购订单
   * @param dto 确认参数
   */
  async confirmPurchaseOrderByDepartment(dto: PurchaseOrderConfirmDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const order = await this.prisma.purchaseOrder.findFirst({
      where: { AND: [{ id: dto.id }, accessibleBy(ability).PurchaseOrder] },
      include: { purchaseDetails: { include: { good: true } } },
    })
    if (!order) {
      throw new NotFoundException('采购订单不存在或无权操作')
    }
    if (order.departmentConfirmStatus) {
      return true
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({ where: { id: order.id }, data: { departmentConfirmStatus: true } })

      for (const detail of order.purchaseDetails) {
        let stockInfo = await tx.yunCangStockInfo.findUnique({ where: { goodId: detail.goodId } })
        if (!stockInfo) {
          stockInfo = await tx.yunCangStockInfo.create({
            data: {
              goodId: detail.goodId,
              dailySalesQuantity: 0,
              monthlySalesQuantity: 0,
              reorderThreshold: 10,
              sluggishDays: 0,
            },
          })
        }

        let poolId = stockInfo.yunCangInventoryPoolId
        if (!poolId) {
          const pool = await tx.yunCangInventoryPool.create({ data: { quantity: 0 } })
          poolId = pool.id
          await tx.yunCangStockInfo.update({ where: { id: stockInfo.id }, data: { yunCangInventoryPoolId: poolId } })
        }

        await tx.yunCangInventoryPool.update({
          where: { id: poolId },
          data: { quantity: { increment: detail.quantity } },
        })

        await tx.goodChangeLog.create({
          data: {
            goodId: detail.goodId,
            userId: user.id,
            username: user.username,
            content: `采购订单[${order.purchaseBatchNumber}]确认，增加库存[${detail.quantity}]`,
          },
        })
      }
    })

    return true
  }

  /**
   * 财务确认采购订单
   * @param dto 确认参数
   */
  async confirmPurchaseOrderByFinance(dto: PurchaseOrderConfirmDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const order = await this.prisma.purchaseOrder.findFirst({
      where: { AND: [{ id: dto.id }, accessibleBy(ability).PurchaseOrder] },
    })
    if (!order) {
      throw new NotFoundException('采购订单不存在或无权操作')
    }
    if (!order.departmentConfirmStatus) {
      throw new BadRequestException('请先完成部门确认')
    }

    await this.prisma.purchaseOrder.update({ where: { id: order.id }, data: { financeConfirmStatus: true } })
    return true
  }

  /**
   * 导出云仓库存
   * @param query 查询参数
   * @returns Excel
   */
  async exportYunCangStock(query: YunCangStockQueryDto): Promise<ExcelResult> {
    const { rows } = await this.listYunCangStock({ ...query, current: 1, pageSize: Number.MAX_SAFE_INTEGER })
    const exportRows = (rows as any[]).map((row) => [row.departmentName || '', row.shopName || '', row.sku || '', row.responsiblePerson || '', row.shelfNumber || '', row.imageUrl || '', row.inboundBarcode || '', row.spec || '', row.actualQuantity || 0, row.dailySalesQuantity || 0, row.monthlySalesQuantity || 0, row.reorderThreshold || 0, row.sluggishDays || 0])

    return new ExcelResult({
      filename: `云仓库存信息_${new Date().toISOString().split('T')[0]}.xlsx`,
      headers: ['部门', '店铺名称', 'SKU', '负责人', '货号', '产品图片', '入仓条码', '产品规格', '库存数量', '日销量', '月销量', '补货预警阈值', '滞销天数'],
      rows: exportRows,
    })
  }

  /**
   * 导出采购订单
   * @param query 查询参数
   * @returns Excel
   */
  async exportPurchaseOrder(query: PurchaseOrderQueryDto): Promise<ExcelResult> {
    const { rows } = await this.listPurchaseOrder({ ...query, current: 1, pageSize: Number.MAX_SAFE_INTEGER })

    const exportRows: any[][] = []
    for (const order of rows as PurchaseOrderEntity[]) {
      for (const detail of order.purchaseDetails) {
        exportRows.push([order.purchaseBatchNumber, order.departmentConfirmStatus ? '是' : '否', order.financeConfirmStatus ? '是' : '否', detail.sku, detail.name || '', detail.quantity, detail.purchaseAmount, detail.purchaseOrderNumber || '', detail.expressNo || '', order.createdAt])
      }
    }

    return new ExcelResult({
      filename: `采购订单_${new Date().toISOString().split('T')[0]}.xlsx`,
      headers: ['采购批次号', '部门确认', '财务确认', 'SKU', '商品名称', '采购数量', '采购金额', '采购订单号', '快递单号', '创建时间'],
      rows: exportRows,
    })
  }

  private mapPurchaseOrder(record: any): PurchaseOrderEntity {
    return {
      id: record.id,
      purchaseBatchNumber: record.purchaseBatchNumber,
      departmentConfirmStatus: record.departmentConfirmStatus,
      financeConfirmStatus: record.financeConfirmStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      purchaseDetails:
        record.purchaseDetails?.map(
          (d: any): PurchaseDetailEntity => ({
            id: d.id,
            goodId: d.goodId,
            sku: d.good?.sku ?? '',
            name: null,
            quantity: d.quantity,
            purchaseAmount: Number(d.purchaseAmount),
            purchaseOrderNumber: d.purchaseOrderNumber ?? null,
            expressNo: d.expressNo ?? null,
          }),
        ) ?? [],
    }
  }

  /**
   * 设置补货预警阈值
   * @param dto 设置参数
   * @returns 更新后的库存信息
   */
  async setReorderThreshold(dto: SetReorderThresholdDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 查询库存信息是否存在
    const stockInfo = await this.prisma.jingCangStockInfo.findFirst({ where: { AND: [{ id: dto.id }, accessibleBy(ability).JingCangStockInfo] } })
    if (!stockInfo) {
      throw new NotFoundException('库存信息不存在或无权操作')
    }

    // 3. 更新补货预警阈值
    const updatedStockInfo = await this.prisma.jingCangStockInfo.update({
      where: { id: dto.id },
      data: { reorderThreshold: dto.reorderThreshold },
    })

    return updatedStockInfo
  }

  /**
   * 导出京仓库存信息
   * @param query 查询参数
   * @returns Excel 文件
   */
  async exportJingCangStock(query: JingCangStockQueryDto): Promise<ExcelResult> {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 先查询有库存信息的商品ID列表（用于统计总数和分页）
    // 注意：这里不应用 warehouse 筛选，因为需要在所有库存记录上判断是否达到预警或滞销
    const allStockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {},
      select: {
        goodId: true,
        stockQuantity: true,
        reorderThreshold: true,
        warehouse: true,
        sluggishDays: true,
      },
    })

    // 如果筛选是否达到补货预警或滞销产品，需要过滤出符合条件的商品
    let filteredGoodIds: string[]

    // 先处理补货预警筛选
    let afterLowStockFilter: typeof allStockInfos = allStockInfos
    if (query.isLowStock === true) {
      // 只返回至少有一个库存记录达到预警的商品（stockQuantity <= reorderThreshold）
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      const lowStockGoodIds = new Set(filteredInfos.filter((info) => info.stockQuantity <= info.reorderThreshold).map((info) => info.goodId))
      afterLowStockFilter = allStockInfos.filter((info) => lowStockGoodIds.has(info.goodId))
    } else if (query.isLowStock === false) {
      // 只返回所有库存记录都未达到预警的商品（所有库存记录都 stockQuantity > reorderThreshold）
      // 按商品分组，判断每个商品是否所有库存记录都未达到预警
      const goodStockMap = new Map<string, Array<{ stockQuantity: number; reorderThreshold: number; warehouse: string }>>()
      for (const info of allStockInfos) {
        if (!goodStockMap.has(info.goodId)) {
          goodStockMap.set(info.goodId, [])
        }
        goodStockMap.get(info.goodId)!.push({
          stockQuantity: info.stockQuantity,
          reorderThreshold: info.reorderThreshold,
          warehouse: info.warehouse,
        })
      }

      // 找出所有库存记录都未达到预警的商品
      const notLowStockGoodIds: string[] = []
      for (const [goodId, stockList] of goodStockMap.entries()) {
        // 如果指定了 warehouse，只检查该 warehouse 的库存记录
        const checkList = query.warehouse ? stockList.filter((s) => s.warehouse === query.warehouse) : stockList
        // 如果该商品在指定 warehouse 下没有库存记录，跳过
        if (checkList.length === 0) continue
        // 检查是否所有库存记录都未达到预警
        const allNotLowStock = checkList.every((s) => s.stockQuantity > s.reorderThreshold)
        if (allNotLowStock) {
          notLowStockGoodIds.push(goodId)
        }
      }
      afterLowStockFilter = allStockInfos.filter((info) => notLowStockGoodIds.includes(info.goodId))
    }

    // 再处理滞销产品筛选
    if (query.isSluggish === true) {
      // 只返回至少有一个库存记录的滞销天数 > 7 的商品
      const filteredInfos = query.warehouse ? afterLowStockFilter.filter((info) => info.warehouse === query.warehouse) : afterLowStockFilter
      const sluggishGoodIds = new Set(filteredInfos.filter((info) => info.sluggishDays > 7).map((info) => info.goodId))
      filteredGoodIds = Array.from(sluggishGoodIds)
    } else if (query.isSluggish === false) {
      // 只返回所有库存记录的滞销天数都 <= 7 的商品
      const goodStockMap = new Map<string, Array<{ sluggishDays: number; warehouse: string }>>()
      for (const info of afterLowStockFilter) {
        if (!goodStockMap.has(info.goodId)) {
          goodStockMap.set(info.goodId, [])
        }
        goodStockMap.get(info.goodId)!.push({
          sluggishDays: info.sluggishDays,
          warehouse: info.warehouse,
        })
      }

      const notSluggishGoodIds: string[] = []
      for (const [goodId, stockList] of goodStockMap.entries()) {
        const checkList = query.warehouse ? stockList.filter((s) => s.warehouse === query.warehouse) : stockList
        if (checkList.length === 0) continue
        const allNotSluggish = checkList.every((s) => s.sluggishDays <= 7)
        if (allNotSluggish) {
          notSluggishGoodIds.push(goodId)
        }
      }
      filteredGoodIds = notSluggishGoodIds
    } else {
      // 未传参，返回所有商品
      const filteredInfos = query.warehouse ? afterLowStockFilter.filter((info) => info.warehouse === query.warehouse) : afterLowStockFilter
      filteredGoodIds = Array.from(new Set(filteredInfos.map((info) => info.goodId)))
    }

    const distinctGoodIds = filteredGoodIds

    // 2. 查询所有符合条件的商品（不分页，用于导出）
    const allGoods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            id: { in: distinctGoodIds },
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
        sku: true,
        departmentName: true,
        shopName: true,
        responsiblePerson: true,
        shelfNumber: true,
        imageUrl: true,
        inboundBarcode: true,
        spec: true,
        purchaseCost: true,
      },
    })

    // 3. 批量查询这些商品的库存信息
    const goodIds = allGoods.map((good) => good.id)
    const stockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
        warehouse: query.warehouse || undefined,
      },
      orderBy: [{ goodId: 'asc' }, { warehouse: 'asc' }],
    })

    // 4. 构建商品映射
    const goodsMap = new Map(
      allGoods.map((good) => [
        good.id,
        {
          departmentName: good.departmentName,
          shopName: good.shopName,
          sku: good.sku,
          responsiblePerson: good.responsiblePerson,
          shelfNumber: good.shelfNumber,
          imageUrl: good.imageUrl,
          inboundBarcode: good.inboundBarcode,
          spec: good.spec,
          purchaseCost: good.purchaseCost ? Number(good.purchaseCost) : null,
        },
      ]),
    )

    // 5. 构建导出数据行（每个商品+库房组合一行）
    const rows: any[][] = []
    for (const stockInfo of stockInfos) {
      const good = goodsMap.get(stockInfo.goodId)
      if (!good) continue

      // 根据筛选条件决定是否添加
      let shouldAdd = true

      if (query.isLowStock === true) {
        shouldAdd = stockInfo.stockQuantity <= stockInfo.reorderThreshold
      } else if (query.isLowStock === false) {
        shouldAdd = stockInfo.stockQuantity > stockInfo.reorderThreshold
      }

      if (query.isSluggish === true) {
        shouldAdd = shouldAdd && stockInfo.sluggishDays > 7
      } else if (query.isSluggish === false) {
        shouldAdd = shouldAdd && stockInfo.sluggishDays <= 7
      }

      if (!shouldAdd) continue

      // 计算周转天数
      const turnoverDays = stockInfo.dailySalesQuantity > 0 ? stockInfo.stockQuantity / stockInfo.dailySalesQuantity : null

      // 计算进货成本总货值
      const purchaseCostValue = good.purchaseCost !== null ? stockInfo.stockQuantity * good.purchaseCost : null

      rows.push([good.departmentName || '', good.shopName || '', good.sku || '', good.responsiblePerson || '', good.shelfNumber || '', good.imageUrl || '', good.inboundBarcode || '', good.spec || '', stockInfo.warehouse || '', stockInfo.stockQuantity || 0, stockInfo.dailySalesQuantity || 0, stockInfo.monthlySalesQuantity || 0, turnoverDays !== null ? turnoverDays.toFixed(2) : '', stockInfo.sluggishDays || 0, purchaseCostValue !== null ? purchaseCostValue.toFixed(2) : ''])
    }

    // 6. 返回 Excel 结果
    return new ExcelResult({
      filename: `京仓库存信息_${new Date().toISOString().split('T')[0]}.xlsx`,
      headers: ['部门', '店铺名称', 'SKU', '负责人', '货号', '产品图片', '入仓条码', '产品规格', '所属库房', '库存数量', '日销量', '月销量', '周转天数', '滞销天数', '进货成本总货值'],
      rows,
    })
  }
}
