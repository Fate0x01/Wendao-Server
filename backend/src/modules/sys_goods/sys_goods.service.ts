import { accessibleBy } from '@casl/prisma'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Decimal } from '@prisma/client/runtime/library'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import defineAbilityFor from 'src/shared/casl/casl-ability.factory'
import { Actions } from 'src/shared/casl/casl-interface'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import * as xlsx from 'xlsx'
import { ReqUser } from '../sys_auth/types/request'
import { AddExtraCostDto } from './dto/add-extra-cost.dto'
import { ChangeLogQueryDto } from './dto/change-log-query.dto'
import { GoodsQueryDto } from './dto/goods-query.dto'
import { UpdateGoodsDto } from './dto/update-goods.dto'

@Injectable()
export class SysGoodsService {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
  ) {}

  /**
   * 查询商品列表（分页）
   * @param query 查询参数
   * @returns 商品列表和总数
   */
  async list(query: GoodsQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    const { rows, total } = await this.nestPrisma.client.goods.findAndCount({
      where: {
        AND: [
          {
            departmentId: query.departmentId || undefined,
            shopName: query.shopName ? { contains: query.shopName } : undefined,
            shelfNumber: query.shelfNumber || undefined,
            inboundBarcode: query.inboundBarcode || undefined,
            responsiblePerson: query.responsiblePerson ? { contains: query.responsiblePerson } : undefined,
            ...(query.skuKeyword ? { sku: { contains: query.skuKeyword } } : {}),
          },
          accessibleBy(ability).Goods,
        ],
      },
      include: {
        extraCosts: true,
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })

    return { rows, total }
  }

  /**
   * 更新商品信息
   * @param dto 更新参数
   * @returns 更新后的商品
   */
  async update(dto: UpdateGoodsDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 检查商品是否存在及权限
    const existingGood = await this.prisma.goods.findFirst({
      where: {
        id: dto.id,
        AND: [accessibleBy(ability).Goods],
      },
      include: {
        department: true,
      },
    })

    if (!existingGood) {
      throw new NotFoundException('商品不存在或无权限操作')
    }

    if (!ability.can(Actions.Update, 'Goods', existingGood.id)) {
      throw new ForbiddenException('无权限更新商品')
    }

    // 获取部门信息（如果更新了部门ID）
    let departmentName = existingGood.departmentName
    if (dto.departmentId !== undefined && dto.departmentId !== existingGood.departmentId) {
      // 检查新部门是否存在
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { name: true },
      })
      if (!department) {
        throw new BadRequestException('部门不存在')
      }
      // 检查是否有权限操作新部门的商品
      // 通过检查用户是否有权限访问新部门的商品来判断是否有权限管理该部门的商品
      const accessibleGoods = await this.prisma.goods.findFirst({
        where: {
          departmentId: dto.departmentId,
          AND: [accessibleBy(ability).Goods],
        },
        select: { id: true },
      })
      // 如果新部门有商品但用户无法访问，说明没有权限
      const deptGoodsCount = await this.prisma.goods.count({
        where: { departmentId: dto.departmentId },
      })
      if (deptGoodsCount > 0 && !accessibleGoods) {
        throw new ForbiddenException('无权限将商品移动到该部门')
      }
      // 如果新部门有商品且用户能访问，检查是否有管理权限
      if (accessibleGoods && !ability.can(Actions.Manage, 'Goods', accessibleGoods.id)) {
        throw new ForbiddenException('无权限将商品移动到该部门')
      }
      departmentName = department.name
    }

    // SKU 唯一性检查：当更新 SKU 时，检查新的 SKU 是否已存在于其他商品
    if (dto.sku !== undefined && dto.sku !== existingGood.sku) {
      const existingGoodWithSku = await this.prisma.goods.findFirst({ where: { sku: dto.sku, id: { not: dto.id } }, select: { id: true } })
      if (existingGoodWithSku) {
        throw new BadRequestException(`SKU "${dto.sku}" 已存在于其他商品`)
      }
    }

    // 构建更新数据
    const updateData: any = {}
    if (dto.departmentId !== undefined) {
      updateData.departmentId = dto.departmentId
      if (dto.departmentId !== existingGood.departmentId) {
        updateData.departmentName = departmentName
      }
    }
    if (dto.shopName !== undefined) updateData.shopName = dto.shopName
    if (dto.sku !== undefined) updateData.sku = dto.sku
    if (dto.responsiblePerson !== undefined) updateData.responsiblePerson = dto.responsiblePerson
    if (dto.shelfNumber !== undefined) updateData.shelfNumber = dto.shelfNumber
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl
    if (dto.inboundBarcode !== undefined) updateData.inboundBarcode = dto.inboundBarcode
    if (dto.spec !== undefined) updateData.spec = dto.spec
    if (dto.certificateImageUrl !== undefined) updateData.certificateImageUrl = dto.certificateImageUrl
    if (dto.purchaseCost !== undefined) updateData.purchaseCost = new Decimal(dto.purchaseCost)
    if (dto.minSalePrice !== undefined) updateData.minSalePrice = new Decimal(dto.minSalePrice)
    if (dto.expressFee !== undefined) updateData.expressFee = new Decimal(dto.expressFee)
    if (dto.materialCost !== undefined) updateData.materialCost = new Decimal(dto.materialCost)
    if (dto.salesOutboundFee !== undefined) updateData.salesOutboundFee = new Decimal(dto.salesOutboundFee)
    if (dto.tcToWarehouseFee !== undefined) updateData.tcToWarehouseFee = new Decimal(dto.tcToWarehouseFee)
    if (dto.manualPackingFee !== undefined) updateData.manualPackingFee = new Decimal(dto.manualPackingFee)
    if (dto.transactionServiceRatio !== undefined) updateData.transactionServiceRatio = new Decimal(dto.transactionServiceRatio)
    if (dto.commissionRatio !== undefined) updateData.commissionRatio = new Decimal(dto.commissionRatio)
    if (dto.platformPromotionRatio !== undefined) updateData.platformPromotionRatio = new Decimal(dto.platformPromotionRatio)
    if (dto.lossRatio !== undefined) updateData.lossRatio = new Decimal(dto.lossRatio)

    // 对比新旧值，生成变动日志内容
    const changes: string[] = []
    const fieldNames: Record<string, string> = {
      departmentId: '部门',
      shopName: '店铺名称',
      sku: 'SKU',
      responsiblePerson: '负责人',
      shelfNumber: '货架号',
      imageUrl: '产品图片',
      inboundBarcode: '入仓条码',
      spec: '产品规格',
      certificateImageUrl: '合格证图',
      purchaseCost: '进货成本',
      minSalePrice: '最低售价',
      expressFee: '快递费用',
      materialCost: '耗材费',
      salesOutboundFee: '销售出库费',
      tcToWarehouseFee: 'TC 到仓费',
      manualPackingFee: '人工打包费',
      transactionServiceRatio: '交易服务费比例',
      commissionRatio: '佣金比例',
      platformPromotionRatio: '平台推广比例',
      lossRatio: '货损比例',
    }

    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'departmentName') continue // 跳过冗余字段
      const fieldName = fieldNames[key] || key
      const oldValue = existingGood[key as keyof typeof existingGood]
      let oldValStr = oldValue === null || oldValue === undefined ? '空' : String(oldValue)
      let newValStr = value === null || value === undefined ? '空' : String(value)

      // 处理 Decimal 类型
      if (oldValue instanceof Decimal) oldValStr = oldValue.toString()
      if (value instanceof Decimal) newValStr = value.toString()

      // SKU 已经是字符串类型，无需特殊处理
      if (oldValStr !== newValStr) {
        changes.push(`${fieldName}: ${oldValStr} → ${newValStr}`)
      }
    }

    // 执行更新
    const updatedGood = await this.prisma.goods.update({
      where: { id: dto.id },
      data: updateData,
      include: {
        extraCosts: true,
      },
    })

    // 创建变动日志
    if (changes.length > 0) {
      await this.prisma.goodChangeLog.create({
        data: {
          goodId: dto.id,
          userId: user.id,
          username: user.username,
          content: `修改商品：${changes.join('; ')}`,
        },
      })
    }

    return updatedGood
  }

  /**
   * 删除商品
   * @param id 商品ID
   * @returns 删除的商品
   */
  async remove(id: string) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 检查商品是否存在及权限
    const existingGood = await this.prisma.goods.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).Goods],
      },
    })

    if (!existingGood) {
      throw new NotFoundException('商品不存在或无权限操作')
    }

    if (!ability.can(Actions.Delete, 'Goods', existingGood.id)) {
      throw new ForbiddenException('无权限删除商品')
    }

    // 提取 SKU 信息
    const skuInfo = existingGood.sku || '无'

    // 创建变动日志（在删除前）
    await this.prisma.goodChangeLog.create({
      data: {
        userId: user.id,
        username: user.username,
        content: `删除商品：SKU ${skuInfo}`,
      },
    })

    // 删除商品（级联删除额外成本和变动日志）
    const deletedGood = await this.prisma.goods.delete({ where: { id }, include: { extraCosts: true } })
    return deletedGood
  }

  /**
   * 查询商品变动日志列表（分页）
   * @param query 查询参数
   * @returns 变动日志列表和总数
   */
  async getChangeLogs(query: ChangeLogQueryDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 通过商品关联进行权限过滤
    const { rows, total } = await this.nestPrisma.client.goodChangeLog.findAndCount({
      where: {
        AND: [
          {
            goodId: query.goodId || undefined,
            userId: query.userId || undefined,
            username: query.username ? { contains: query.username } : undefined,
            good: { departmentId: query.departmentId || undefined },
            ...(query.startTime || query.endTime
              ? {
                  createdAt: {
                    ...(query.startTime ? { gte: new Date(query.startTime) } : {}),
                    ...(query.endTime ? { lte: new Date(query.endTime) } : {}),
                  },
                }
              : {}),
          },
          accessibleBy(ability).GoodChangeLog,
        ],
      },
      include: {
        good: true,
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })

    return { rows, total }
  }

  /**
   * 添加商品额外成本
   * @param dto 额外成本信息
   * @returns 创建的额外成本
   */
  async addExtraCost(dto: AddExtraCostDto) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 检查商品是否存在及权限
    const existingGood = await this.prisma.goods.findFirst({ where: { id: dto.goodId, AND: [accessibleBy(ability).Goods] }, select: { id: true } })
    if (!existingGood) throw new NotFoundException('商品不存在或无权限操作')
    if (!ability.can(Actions.Update, 'Goods', existingGood.id)) throw new ForbiddenException('无权限为该商品添加额外成本')

    // 创建额外成本
    const extraCost = await this.prisma.extraCost.create({ data: { goodId: dto.goodId, amount: new Decimal(dto.amount), description: dto.description || null } })

    // 创建变动日志
    const logContent = `添加额外成本：${dto.amount}元${dto.description ? `，描述：${dto.description}` : ''}`
    await this.prisma.goodChangeLog.create({
      data: {
        goodId: dto.goodId,
        userId: user.id,
        username: user.username,
        content: logContent,
      },
    })

    return extraCost
  }

  /**
   * 删除商品额外成本
   * @param id 额外成本ID
   * @returns 删除的额外成本
   */
  async removeExtraCost(id: string) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 查找额外成本及其关联商品
    const extraCost = await this.prisma.extraCost.findUnique({ where: { id }, include: { good: true } })
    if (!extraCost) throw new NotFoundException('额外成本不存在')

    // 2. 检查权限（需有对应商品的更新权限）
    const good = await this.prisma.goods.findFirst({ where: { id: extraCost.goodId, AND: [accessibleBy(ability).Goods] } })
    if (!good) throw new ForbiddenException('无权限操作该商品的额外成本')
    if (!ability.can(Actions.Update, 'Goods', good.id)) throw new ForbiddenException('无权限删除该商品的额外成本')

    // 3. 删除
    await this.prisma.extraCost.delete({ where: { id } })

    // 4. 记录日志
    const logContent = `删除额外成本：${extraCost.amount}元${extraCost.description ? `，描述：${extraCost.description}` : ''}`
    await this.prisma.goodChangeLog.create({
      data: {
        goodId: extraCost.goodId,
        userId: user.id,
        username: user.username,
        content: logContent,
      },
    })

    return extraCost
  }

  /**
   * 导入商品
   * @param file Excel文件
   */
  async importGoods(file: Express.Multer.File) {
    const user = this.cls.get<ReqUser>('user')
    const ability = defineAbilityFor(user)

    // 1. 解析 Excel
    const workbook = xlsx.read(file.buffer, { type: 'buffer' })
    if (!workbook.SheetNames.length) throw new BadRequestException('Excel 文件为空')
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(sheet)
    if (!rawData.length) throw new BadRequestException('Excel 数据为空')

    // 2. 获取所有部门映射 (name -> {id, parentId})，减少数据库查询
    const allDepartments = await this.prisma.department.findMany({ select: { id: true, name: true, parentId: true } })
    const deptMap = new Map<string, { id: string; parentId: string | null }>()
    for (const dept of allDepartments) {
      deptMap.set(dept.name, { id: dept.id, parentId: dept.parentId })
    }

    // 加载用户具备操作权限的部门信息
    const accessibleDepts = await this.nestPrisma.client.department.findMany({ where: { AND: [accessibleBy(ability).Department] }, select: { id: true } })
    const accessibleDeptIds = new Set(accessibleDepts.map((d) => d.id))

    // 3. 转换并插入/更新数据（基于 SKU 的 upsert）
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // 字段映射
    const decimalFields = [
      ['进货成本', 'purchaseCost'],
      ['最低售价', 'minSalePrice'],
      ['快递费', 'expressFee'],
      ['耗材费', 'materialCost'],
      ['销售出库费', 'salesOutboundFee'],
      ['TC到仓费', 'tcToWarehouseFee'],
      ['人工打包费', 'manualPackingFee'],
      ['交易服务费', 'transactionServiceRatio'],
      ['佣金', 'commissionRatio'],
      ['平台推广费', 'platformPromotionRatio'],
      ['货损', 'lossRatio'],
    ]

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i]
      try {
        const deptName = row['部门']
        if (!deptName) {
          throw new Error('部门不能为空')
        }

        const deptInfo = deptMap.get(deptName)
        if (!deptInfo) {
          throw new Error(`部门 "${deptName}" 不存在`)
        }

        // 权限检查：直接判断是否具备该部门的访问权限
        if (!accessibleDeptIds.has(deptInfo.id)) {
          throw new ForbiddenException(`无权限操作部门 "${deptName}"`)
        }

        // 构建基础数据
        const goodsData: any = {
          departmentId: deptInfo.id,
          departmentName: deptName,
          shopName: row['店铺名称'] ? String(row['店铺名称']) : null,
          responsiblePerson: row['负责人'] ? String(row['负责人']) : null,
          shelfNumber: row['货号'] ? String(row['货号']) : null,
          imageUrl: row['产品图片'] ? String(row['产品图片']) : null,
          inboundBarcode: row['入仓条码'] ? String(row['入仓条码']) : null,
          spec: row['产品规格'] ? String(row['产品规格']) : null,
          certificateImageUrl: row['合格证图'] ? String(row['合格证图']) : null,
        }

        // 处理SKU
        const skuVal = row['SKU']
        if (!skuVal || String(skuVal).trim() === '') {
          throw new Error('SKU 不能为空')
        }
        const sku = String(skuVal).trim()
        goodsData.sku = sku

        // 处理数值字段
        for (const [cn, en] of decimalFields) {
          if (row[cn] !== undefined && row[cn] !== '') {
            goodsData[en] = new Decimal(row[cn])
          }
        }

        // 基于 SKU 进行 upsert
        const existingGood = await this.prisma.goods.findUnique({
          where: { sku },
          select: { id: true },
        })

        let good
        let isUpdate = false
        if (existingGood) {
          // 检查权限：需要能够访问该商品
          const accessibleGood = await this.prisma.goods.findFirst({
            where: {
              id: existingGood.id,
              AND: [accessibleBy(ability).Goods],
            },
          })
          if (!accessibleGood) {
            throw new ForbiddenException(`无权限更新 SKU "${sku}" 对应的商品`)
          }
          if (!ability.can(Actions.Update, 'Goods', existingGood.id)) {
            throw new ForbiddenException(`无权限更新 SKU "${sku}" 对应的商品`)
          }

          // 更新商品
          good = await this.prisma.goods.update({
            where: { id: existingGood.id },
            data: goodsData,
          })
          isUpdate = true
        } else {
          // 创建新商品
          good = await this.prisma.goods.create({ data: goodsData })
        }

        // 记录导入/更新日志
        const logContent = isUpdate ? `导入更新商品（SKU: ${sku}）` : `导入商品（SKU: ${sku}）`
        await this.prisma.goodChangeLog.create({
          data: {
            goodId: good.id,
            userId: user.id,
            username: user.username,
            content: logContent,
          },
        })
        successCount++
      } catch (error) {
        failCount++
        const errorMsg = error instanceof ForbiddenException ? error.message : error.message
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
   * 导入 EMG/SKU 映射
   * @param file Excel文件
   */
  async importEmgSkuMapping(file: Express.Multer.File) {
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

    // 2. 处理数据并执行 upsert
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < rawData.length; i++) {
      const row: any = rawData[i]
      try {
        // 获取 EMG 和 SKU 列
        const emgSku = row['EMG'] || row['事业部商品编码']
        const sku = row['SKU'] || row['平台商品编码']
        if (!emgSku || String(emgSku).trim() === '') throw new BadRequestException('EMG 不能为空')
        if (!sku || String(sku).trim() === '') throw new BadRequestException('SKU 不能为空')
        const emgSkuValue = String(emgSku).trim()
        const skuValue = String(sku).trim()

        // 使用 upsert 操作，基于 emgSku 作为唯一键
        await this.prisma.emgSkuMapping.upsert({
          where: { emgSku: emgSkuValue },
          update: { sku: skuValue },
          create: { emgSku: emgSkuValue, sku: skuValue },
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
}
