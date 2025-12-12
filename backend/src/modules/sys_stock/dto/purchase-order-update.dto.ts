import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class PurchaseDetailUpdateInput {
  @ApiProperty({ description: '商品SKU', type: String })
  @IsString({ message: '商品SKU必须为字符串' })
  sku: string

  @ApiProperty({ description: '采购数量', type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: '采购数量必须为数字' })
  @Min(1, { message: '采购数量需大于0' })
  quantity: number

  @ApiProperty({ description: '采购金额', type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: '采购金额必须为数字' })
  @Min(0, { message: '采购金额不能小于0' })
  purchaseAmount: number

  @ApiPropertyOptional({ description: '采购订单号', type: String })
  @IsOptional()
  @IsString({ message: '采购订单号必须为字符串' })
  purchaseOrderNumber?: string

  @ApiPropertyOptional({ description: '快递单号', type: String })
  @IsOptional()
  @IsString({ message: '快递单号必须为字符串' })
  expressNo?: string
}

export class PurchaseOrderUpdateDto {
  @ApiProperty({ description: '采购订单ID', type: String })
  @IsString({ message: '采购订单ID必须为字符串' })
  id: string

  @ApiPropertyOptional({ description: '采购批次号', type: String })
  @IsOptional()
  @IsString({ message: '采购批次号必须为字符串' })
  purchaseBatchNumber?: string

  @ApiPropertyOptional({ description: '采购详情列表', type: [PurchaseDetailUpdateInput] })
  @IsOptional()
  @IsArray({ message: '采购详情必须为数组' })
  @ArrayMinSize(1, { message: '至少需要一条采购详情' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseDetailUpdateInput)
  purchaseDetails?: PurchaseDetailUpdateInput[]
}
