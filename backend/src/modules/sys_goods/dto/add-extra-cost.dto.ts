import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class AddExtraCostDto {
  @ApiProperty({ description: '商品ID', type: String })
  @IsString({ message: '商品ID必须为字符串' })
  goodId: string

  @ApiProperty({ description: '金额', type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: '金额必须为数字' })
  @Min(0, { message: '金额不能小于0' })
  amount: number

  @ApiPropertyOptional({ description: '描述', type: String })
  @IsOptional()
  @IsString({ message: '描述必须为字符串' })
  description?: string
}

