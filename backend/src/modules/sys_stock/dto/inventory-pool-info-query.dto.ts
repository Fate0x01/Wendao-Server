import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class InventoryPoolInfoQueryDto {
  @ApiProperty({ description: '商品ID', type: String })
  @IsString({ message: '商品ID必须为字符串' })
  goodId: string
}
