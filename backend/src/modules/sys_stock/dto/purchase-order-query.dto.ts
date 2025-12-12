import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class PurchaseOrderQueryDto {
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

  @ApiPropertyOptional({ description: '采购批次号', type: String })
  @IsOptional()
  @IsString({ message: '采购批次号必须为字符串' })
  purchaseBatchNumber?: string

  @ApiPropertyOptional({ description: '部门ID', type: String })
  @IsOptional()
  @IsString({ message: '部门ID必须为字符串' })
  departmentId?: string

  @ApiPropertyOptional({ description: '部门确认状态', type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '部门确认状态必须为布尔值' })
  departmentConfirmStatus?: boolean

  @ApiPropertyOptional({ description: '财务确认状态', type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '财务确认状态必须为布尔值' })
  financeConfirmStatus?: boolean

  @ApiPropertyOptional({ description: '创建开始时间', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '创建开始时间格式不正确' })
  createdAtStart?: Date

  @ApiPropertyOptional({ description: '创建结束时间', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '创建结束时间格式不正确' })
  createdAtEnd?: Date
}
