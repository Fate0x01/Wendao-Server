import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class YunCangStockQueryDto {
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

  @ApiPropertyOptional({ description: '部门ID', type: String })
  @IsOptional()
  @IsString({ message: '部门ID必须为字符串' })
  departmentId?: string

  @ApiPropertyOptional({ description: 'SKU关键词', type: String })
  @IsOptional()
  @IsString({ message: 'SKU关键词必须为字符串' })
  skuKeyword?: string

  @ApiPropertyOptional({ description: '负责人', type: String })
  @IsOptional()
  @IsString({ message: '负责人必须为字符串' })
  responsiblePerson?: string

  @ApiPropertyOptional({ description: '店铺名称', type: String })
  @IsOptional()
  @IsString({ message: '店铺名称必须为字符串' })
  shopName?: string

  @ApiPropertyOptional({ description: '是否达到补货预警', type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '是否达到补货预警必须为布尔值' })
  isLowStock?: boolean

  @ApiPropertyOptional({ description: '是否滞销产品（滞销天数大于7天）', type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '是否滞销产品必须为布尔值' })
  isSluggish?: boolean

  @ApiPropertyOptional({ description: '排序字段', enum: ['createdAt', 'actualQuantity', 'dailySalesQuantity', 'monthlySalesQuantity', 'reorderThreshold', 'sluggishDays'], type: String })
  @IsOptional()
  @IsString({ message: '排序字段必须为字符串' })
  @IsEnum(['createdAt', 'actualQuantity', 'dailySalesQuantity', 'monthlySalesQuantity', 'reorderThreshold', 'sluggishDays'], {
    message: '排序字段必须是 createdAt、actualQuantity、dailySalesQuantity、monthlySalesQuantity、reorderThreshold 或 sluggishDays 之一',
  })
  sortField?: 'createdAt' | 'actualQuantity' | 'dailySalesQuantity' | 'monthlySalesQuantity' | 'reorderThreshold' | 'sluggishDays'

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'], type: String })
  @IsOptional()
  @IsString({ message: '排序方向必须为字符串' })
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  sortOrder?: 'asc' | 'desc'
}
