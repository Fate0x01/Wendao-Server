import { ApiProperty } from '@nestjs/swagger'

export class YunCangStockGroupEntity {
  @ApiProperty({ description: '商品ID', type: String })
  goodId: string

  @ApiProperty({ description: '部门名称', type: String })
  departmentName: string

  @ApiProperty({ description: '店铺名称', type: String, nullable: true })
  shopName: string | null

  @ApiProperty({ description: '商品SKU', type: String })
  sku: string

  @ApiProperty({ description: '负责人', type: String, nullable: true })
  responsiblePerson: string | null

  @ApiProperty({ description: '货号', type: String, nullable: true })
  shelfNumber: string | null

  @ApiProperty({ description: '产品图片', type: String, nullable: true })
  imageUrl: string | null

  @ApiProperty({ description: '入仓条码', type: String, nullable: true })
  inboundBarcode: string | null

  @ApiProperty({ description: '产品规格', type: String, nullable: true })
  spec: string | null

  @ApiProperty({ description: '日销量', type: Number })
  dailySalesQuantity: number

  @ApiProperty({ description: '月销量', type: Number })
  monthlySalesQuantity: number

  @ApiProperty({ description: '补货预警阈值', type: Number })
  reorderThreshold: number

  @ApiProperty({ description: '滞销天数', type: Number })
  sluggishDays: number

  @ApiProperty({ description: '库存池实际数量', type: Number })
  actualQuantity: number

  @ApiProperty({ description: '进货成本', type: Number, nullable: true })
  purchaseCost: number | null

  @ApiProperty({ description: '进货成本总货值', type: Number, nullable: true })
  totalPurchaseCostValue: number | null
}
