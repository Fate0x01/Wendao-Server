import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ExtraCostEntity } from './extra-cost.entity'

export class GoodsEntity {
  @ApiProperty({ description: '商品ID', type: String })
  id: string

  @ApiProperty({ description: '关联部门ID', type: String })
  departmentId: string

  @ApiProperty({ description: '部门名称', type: String })
  departmentName: string

  @ApiPropertyOptional({ description: '店铺名称', nullable: true, type: String })
  shopName?: string | null

  @ApiProperty({ description: 'SKU字符串数组', type: Array })
  sku: string[]

  @ApiPropertyOptional({ description: '货架号', nullable: true, type: String })
  shelfNumber?: string | null

  @ApiPropertyOptional({ description: '产品图片', nullable: true, type: String })
  imageUrl?: string | null

  @ApiPropertyOptional({ description: '入仓条码', nullable: true, type: String })
  inboundBarcode?: string | null

  @ApiPropertyOptional({ description: '产品规格', nullable: true, type: String })
  spec?: string | null

  @ApiPropertyOptional({ description: '合格证图', nullable: true, type: String })
  certificateImageUrl?: string | null

  @ApiPropertyOptional({ description: '进货成本', nullable: true, type: Number })
  purchaseCost?: number | null

  @ApiPropertyOptional({ description: '最低售价', nullable: true, type: Number })
  minSalePrice?: number | null

  @ApiPropertyOptional({ description: '快递费用', nullable: true, type: Number })
  expressFee?: number | null

  @ApiPropertyOptional({ description: '耗材费', nullable: true, type: Number })
  materialCost?: number | null

  @ApiPropertyOptional({ description: '销售出库费', nullable: true, type: Number })
  salesOutboundFee?: number | null

  @ApiPropertyOptional({ description: 'TC 到仓费', nullable: true, type: Number })
  tcToWarehouseFee?: number | null

  @ApiPropertyOptional({ description: '人工打包费', nullable: true, type: Number })
  manualPackingFee?: number | null

  @ApiPropertyOptional({ description: '交易服务费比例', nullable: true, type: Number })
  transactionServiceRatio?: number | null

  @ApiPropertyOptional({ description: '佣金比例', nullable: true, type: Number })
  commissionRatio?: number | null

  @ApiPropertyOptional({ description: '平台推广比例', nullable: true, type: Number })
  platformPromotionRatio?: number | null

  @ApiPropertyOptional({ description: '货损比例', nullable: true, type: Number })
  lossRatio?: number | null

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date

  @ApiProperty({ description: '额外成本列表', type: [ExtraCostEntity] })
  extraCosts: ExtraCostEntity[]
}
