import { ApiProperty } from '@nestjs/swagger'
import { JingCangStockInfoEntity } from './jing-cang-stock-info.entity'

export class JingCangStockGroupEntity {
  @ApiProperty({ description: '商品ID', type: String })
  goodId: string

  @ApiProperty({ description: '部门名称', type: String })
  departmentName: string

  @ApiProperty({ description: '店铺名称', type: String, nullable: true })
  shopName: string | null

  @ApiProperty({ description: '商品SKU', type: String })
  sku: string

  @ApiProperty({ description: '货号', type: String, nullable: true })
  shelfNumber: string | null

  @ApiProperty({ description: '产品图片', type: String, nullable: true })
  imageUrl: string | null

  @ApiProperty({ description: '入仓条码', type: String, nullable: true })
  inboundBarcode: string | null

  @ApiProperty({ description: '产品规格', type: String, nullable: true })
  spec: string | null

  @ApiProperty({ description: '该商品的所有库存信息列表', type: [JingCangStockInfoEntity] })
  stockInfos: JingCangStockInfoEntity[]

  @ApiProperty({ description: '总库存数量', type: Number })
  totalStockQuantity: number

  @ApiProperty({ description: '总日销量', type: Number })
  totalDailySalesQuantity: number

  @ApiProperty({ description: '总月销量', type: Number })
  totalMonthlySalesQuantity: number

  @ApiProperty({ description: '进货成本', type: Number, nullable: true })
  purchaseCost: number | null

  @ApiProperty({ description: '进货成本总货值', type: Number, nullable: true })
  totalPurchaseCostValue: number | null
}
