import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator'

export class SetReorderThresholdDto {
  @ApiProperty({ description: '库存信息ID', type: String })
  @IsNotEmpty({ message: '库存信息ID不能为空' })
  @IsString({ message: '库存信息ID必须为字符串' })
  id: string

  @ApiProperty({ description: '补货预警阈值', type: Number })
  @Type(() => Number)
  @IsInt({ message: '补货预警阈值必须为整数' })
  @Min(0, { message: '补货预警阈值不能小于0' })
  reorderThreshold: number
}
