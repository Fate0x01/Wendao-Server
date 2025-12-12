import { ApiProperty } from '@nestjs/swagger'

export class InventoryPoolInfoEntity {
  @ApiProperty({ description: '商品ID', type: String })
  goodId: string

  @ApiProperty({ description: '商品SKU', type: String })
  sku: string

  @ApiProperty({ description: '部门名称', type: String })
  departmentName: string

  @ApiProperty({ description: '当前库存池ID', type: String, nullable: true })
  yunCangInventoryPoolId: string | null

  @ApiProperty({ description: '库存池实际数量', type: Number })
  actualQuantity: number

  @ApiProperty({ description: '是否独立库存', type: Boolean })
  isIndependent: boolean

  @ApiProperty({ description: '共用该库存池的其他商品', type: [Object] })
  sharedGoods: Array<{
    goodId: string
    sku: string
  }>
}
