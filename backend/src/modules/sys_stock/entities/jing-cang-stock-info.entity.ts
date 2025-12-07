import { ApiProperty } from '@nestjs/swagger'

export class JingCangStockInfoEntity {
  @ApiProperty({ description: '库存信息ID', type: String })
  id: string

  @ApiProperty({ description: '所属库房', type: String })
  warehouse: string

  @ApiProperty({ description: '库存数量', type: Number })
  stockQuantity: number

  @ApiProperty({ description: '日销量', type: Number })
  dailySalesQuantity: number

  @ApiProperty({ description: '月销量', type: Number })
  monthlySalesQuantity: number

  @ApiProperty({ description: '补货预警阈值', type: Number })
  reorderThreshold: number

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date
}
