import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class JingCangStockQueryDto {
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

  @ApiPropertyOptional({ description: '仓库名称', type: String })
  @IsOptional()
  @IsString({ message: '仓库名称必须为字符串' })
  warehouse?: string

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

  @ApiPropertyOptional({ description: '排序字段', enum: ['totalStockQuantity', 'totalDailySalesQuantity', 'totalMonthlySalesQuantity', 'totalPurchaseCostValue'], type: String })
  @IsOptional()
  @IsString({ message: '排序字段必须为字符串' })
  @IsEnum(['totalStockQuantity', 'totalDailySalesQuantity', 'totalMonthlySalesQuantity', 'totalPurchaseCostValue'], {
    message: '排序字段必须是 totalStockQuantity、totalDailySalesQuantity、totalMonthlySalesQuantity 或 totalPurchaseCostValue 之一',
  })
  sortField?: 'totalStockQuantity' | 'totalDailySalesQuantity' | 'totalMonthlySalesQuantity' | 'totalPurchaseCostValue'

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'], type: String })
  @IsOptional()
  @IsString({ message: '排序方向必须为字符串' })
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  sortOrder?: 'asc' | 'desc'
}
