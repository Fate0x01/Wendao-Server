import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { GoodsEntity } from './goods.entity'

export class ChangeLogEntity {
  @ApiProperty({ description: '变动日志ID', type: String })
  id: string

  @ApiProperty({ description: '关联商品ID', type: String })
  goodId: string

  @ApiPropertyOptional({ description: '操作人ID', nullable: true, type: String })
  userId?: string | null

  @ApiProperty({ description: '操作人用户名', type: String })
  username: string

  @ApiProperty({ description: '操作内容', type: String })
  content: string

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiPropertyOptional({ description: '关联商品信息', type: GoodsEntity })
  good?: GoodsEntity
}

