import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class ChangeLogQueryDto {
  @ApiProperty({ description: '当前页', default: 1, type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: 'current 必须为数字' })
  @Min(1, { message: 'current 最小为 1' })
  current = 1

  @ApiProperty({ description: '每页数量', default: 10, type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须为数字' })
  @Min(1, { message: 'pageSize 最小为 1' })
  pageSize = 10

  @ApiPropertyOptional({ description: '商品ID', type: String })
  @IsOptional()
  @IsString({ message: '商品ID必须为字符串' })
  goodId?: string

  @ApiPropertyOptional({ description: '部门ID', type: String })
  @IsOptional()
  @IsString({ message: '部门ID必须为字符串' })
  departmentId?: string

  @ApiPropertyOptional({ description: '操作人ID', type: String })
  @IsOptional()
  @IsString({ message: '操作人ID必须为字符串' })
  userId?: string

  @ApiPropertyOptional({ description: '操作人用户名关键词', type: String })
  @IsOptional()
  @IsString({ message: '操作人用户名关键词必须为字符串' })
  username?: string

  @ApiPropertyOptional({ description: '开始时间', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({}, { message: '开始时间必须为有效的日期字符串' })
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({}, { message: '结束时间必须为有效的日期字符串' })
  endTime?: string
}
