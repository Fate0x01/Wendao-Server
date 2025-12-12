import { ApiProperty } from '@nestjs/swagger'

export class PurchaseDetailEntity {
  @ApiProperty({ description: '采购详情ID', type: String })
  id: string

  @ApiProperty({ description: '商品ID', type: String })
  goodId: string

  @ApiProperty({ description: '商品SKU', type: String })
  sku: string

  @ApiProperty({ description: '商品名称', type: String, nullable: true })
  name: string | null

  @ApiProperty({ description: '采购数量', type: Number })
  quantity: number

  @ApiProperty({ description: '采购金额', type: Number })
  purchaseAmount: number

  @ApiProperty({ description: '采购订单号', type: String, nullable: true })
  purchaseOrderNumber: string | null

  @ApiProperty({ description: '快递单号', type: String, nullable: true })
  expressNo: string | null
}
