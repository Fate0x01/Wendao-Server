import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class GoodsQueryDto {
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

  @ApiPropertyOptional({ description: '店铺名称关键词', type: String })
  @IsOptional()
  @IsString({ message: '店铺名称关键词必须为字符串' })
  shopName?: string

  @ApiPropertyOptional({ description: 'SKU关键词', type: String })
  @IsOptional()
  @IsString({ message: 'SKU关键词必须为字符串' })
  skuKeyword?: string

  @ApiPropertyOptional({ description: '货架号', type: String })
  @IsOptional()
  @IsString({ message: '货架号必须为字符串' })
  shelfNumber?: string

  @ApiPropertyOptional({ description: '入仓条码', type: String })
  @IsOptional()
  @IsString({ message: '入仓条码必须为字符串' })
  inboundBarcode?: string

  @ApiPropertyOptional({ description: '负责人', type: String })
  @IsOptional()
  @IsString({ message: '负责人必须为字符串' })
  responsiblePerson?: string
}

