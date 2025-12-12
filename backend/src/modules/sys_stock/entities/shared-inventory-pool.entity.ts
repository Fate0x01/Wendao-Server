import { ApiProperty } from '@nestjs/swagger'

export class SharedInventoryPoolEntity {
  @ApiProperty({ description: '库存池ID', type: String })
  id: string

  @ApiProperty({ description: '库存池实际数量', type: Number })
  quantity: number

  @ApiProperty({ description: '共用该库存池的商品数量', type: Number })
  skuCount: number

  @ApiProperty({ description: '共用该库存池的商品列表', type: [Object] })
  goods: Array<{
    goodId: string
    sku: string
    departmentName: string
    shopName: string | null
  }>

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: Date })
  updatedAt: Date
}

