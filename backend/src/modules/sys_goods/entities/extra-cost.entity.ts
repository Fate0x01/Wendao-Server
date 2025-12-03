import { ApiProperty } from '@nestjs/swagger'

export class ExtraCostEntity {
  @ApiProperty({ description: '额外成本ID', type: String })
  id: string

  @ApiProperty({ description: '关联商品ID', type: String })
  goodId: string

  @ApiProperty({ description: '金额', type: Number })
  amount: number

  @ApiProperty({ description: '描述', nullable: true, type: String })
  description?: string | null

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date
}
