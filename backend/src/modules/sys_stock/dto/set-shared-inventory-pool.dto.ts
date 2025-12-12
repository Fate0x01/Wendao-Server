import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, ArrayMinSize } from 'class-validator'

export class SetSharedInventoryPoolDto {
  @ApiProperty({ description: 'SKU列表（至少2个）', type: [String] })
  @IsArray({ message: 'SKU列表必须为数组' })
  @ArrayMinSize(2, { message: 'SKU列表至少需要2个SKU' })
  @IsString({ each: true, message: '每个SKU必须为字符串' })
  skus: string[]
}

