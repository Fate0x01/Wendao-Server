import { accessibleBy } from '@casl/prisma'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import defineAbilityFor from 'src/shared/casl/casl-ability.factory'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import * as xlsx from 'xlsx'
import { ReqUser } from '../sys_auth/types/request'
import { JingCangStockQueryDto } from './dto/jing-cang-stock-query.dto'
import { SetReorderThresholdDto } from './dto/set-reorder-threshold.dto'

@Injectable()
export class SysStockService {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
  ) {}

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

        // 执行 upsert（基于 goodId 和 warehouse 的唯一约束）
        await this.prisma.jingCangStockInfo.upsert({
          where: {
            goodId_warehouse: {
              goodId,
              warehouse,
            },
          },
          update: {
            stockQuantity: Math.floor(stockQuantity),
            dailySalesQuantity: Math.floor(dailySalesQuantity),
            monthlySalesQuantity: Math.floor(monthlySalesQuantity),
          },
          create: {
            goodId,
            warehouse,
            stockQuantity: Math.floor(stockQuantity),
            dailySalesQuantity: Math.floor(dailySalesQuantity),
            monthlySalesQuantity: Math.floor(monthlySalesQuantity),
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
    // 注意：这里不应用 warehouse 筛选，因为需要在所有库存记录上判断是否达到预警
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
      // 只返回至少有一个库存记录达到预警的商品（stockQuantity <= reorderThreshold）
      // 如果指定了 warehouse，需要同时满足 warehouse 条件
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      const lowStockGoodIds = new Set(filteredInfos.filter((info) => info.stockQuantity <= info.reorderThreshold).map((info) => info.goodId))
      filteredGoodIds = Array.from(lowStockGoodIds)
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
      filteredGoodIds = notLowStockGoodIds
    } else {
      // 未传参，返回所有商品
      const filteredInfos = query.warehouse ? allStockInfos.filter((info) => info.warehouse === query.warehouse) : allStockInfos
      filteredGoodIds = Array.from(new Set(filteredInfos.map((info) => info.goodId)))
    }

    const distinctGoodIds = filteredGoodIds

    // 2. 查询符合条件的商品总数（有库存信息且符合筛选条件）
    // 注意：如果筛选了 isLowStock，distinctGoodIds 已经包含了过滤后的商品ID
    const totalGoods = await this.prisma.goods.count({
      where: {
        AND: [
          {
            id: { in: distinctGoodIds },
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
    })

    // 3. 分页查询符合条件的商品
    const goods = await this.prisma.goods.findMany({
      where: {
        AND: [
          {
            id: { in: distinctGoodIds },
            departmentId: query.departmentId || undefined,
            sku: query.skuKeyword ? { contains: query.skuKeyword } : undefined,
          },
          accessibleBy(ability).Goods,
        ],
      },
      select: {
        id: true,
        sku: true,
        departmentName: true,
        shopName: true,
        shelfNumber: true,
        imageUrl: true,
        inboundBarcode: true,
        spec: true,
        purchaseCost: true,
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })

    // 4. 批量查询这些商品的库存信息（返回所有库存信息，不进行过滤）
    const goodIds = goods.map((good) => good.id)
    const stockInfos = await this.prisma.jingCangStockInfo.findMany({
      where: {
        goodId: { in: goodIds },
        warehouse: query.warehouse || undefined,
      },
      orderBy: { warehouse: 'asc' },
    })

    // 5. 按商品分组并计算统计信息
    const goodsMap = new Map<
      string,
      {
        goodId: string
        departmentName: string
        shopName: string | null
        sku: string
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
          createdAt: Date
          updatedAt: Date
        }>
      }
    >()

    // 初始化商品分组
    for (const good of goods) {
      goodsMap.set(good.id, {
        goodId: good.id,
        departmentName: good.departmentName,
        shopName: good.shopName,
        sku: good.sku,
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
        if (query.isLowStock === true) {
          // 只添加达到预警的库存记录（stockQuantity <= reorderThreshold）
          if (stockInfo.stockQuantity <= stockInfo.reorderThreshold) {
            goodGroup.stockInfos.push({
              id: stockInfo.id,
              warehouse: stockInfo.warehouse,
              stockQuantity: stockInfo.stockQuantity,
              dailySalesQuantity: stockInfo.dailySalesQuantity,
              monthlySalesQuantity: stockInfo.monthlySalesQuantity,
              reorderThreshold: stockInfo.reorderThreshold,
              createdAt: stockInfo.createdAt,
              updatedAt: stockInfo.updatedAt,
            })
          }
        } else if (query.isLowStock === false) {
          // 只添加未达到预警的库存记录（stockQuantity > reorderThreshold）
          if (stockInfo.stockQuantity > stockInfo.reorderThreshold) {
            goodGroup.stockInfos.push({
              id: stockInfo.id,
              warehouse: stockInfo.warehouse,
              stockQuantity: stockInfo.stockQuantity,
              dailySalesQuantity: stockInfo.dailySalesQuantity,
              monthlySalesQuantity: stockInfo.monthlySalesQuantity,
              reorderThreshold: stockInfo.reorderThreshold,
              createdAt: stockInfo.createdAt,
              updatedAt: stockInfo.updatedAt,
            })
          }
        } else {
          // 未传参，添加所有库存记录
          goodGroup.stockInfos.push({
            id: stockInfo.id,
            warehouse: stockInfo.warehouse,
            stockQuantity: stockInfo.stockQuantity,
            dailySalesQuantity: stockInfo.dailySalesQuantity,
            monthlySalesQuantity: stockInfo.monthlySalesQuantity,
            reorderThreshold: stockInfo.reorderThreshold,
            createdAt: stockInfo.createdAt,
            updatedAt: stockInfo.updatedAt,
          })
        }
      }
    }

    // 6. 转换为数组并计算统计信息，过滤掉没有库存信息的商品（当筛选时）
    const rows = Array.from(goodsMap.values())
      .filter((group) => {
        // 如果筛选了 isLowStock，过滤掉没有符合条件库存记录的商品
        if (query.isLowStock === true || query.isLowStock === false) {
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

    return { rows, total: totalGoods }
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
}
