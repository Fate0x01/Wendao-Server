import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsString, Min } from 'class-validator'

export class SetYunCangReorderThresholdDto {
  @ApiProperty({ description: '商品ID', type: String })
  @IsString({ message: '商品ID必须为字符串' })
  goodId: string

  @ApiProperty({ description: '补货预警阈值', type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: '补货预警阈值必须为数字' })
  @Min(0, { message: '补货预警阈值不能小于0' })
  reorderThreshold: number
}
