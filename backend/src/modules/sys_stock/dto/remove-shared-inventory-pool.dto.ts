import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RemoveSharedInventoryPoolDto {
  @ApiProperty({ description: 'SKU', type: String })
  @IsString({ message: 'SKU必须为字符串' })
  sku: string
}

