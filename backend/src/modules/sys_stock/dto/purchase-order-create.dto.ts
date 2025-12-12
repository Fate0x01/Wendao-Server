import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class PurchaseDetailInput {
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

  @ApiProperty({ description: '采购订单号', type: String, required: false })
  @IsOptional()
  @IsString({ message: '采购订单号必须为字符串' })
  purchaseOrderNumber?: string

  @ApiProperty({ description: '快递单号', type: String, required: false })
  @IsOptional()
  @IsString({ message: '快递单号必须为字符串' })
  expressNo?: string
}

export class PurchaseOrderCreateDto {
  @ApiProperty({ description: '采购批次号', type: String })
  @IsString({ message: '采购批次号必须为字符串' })
  purchaseBatchNumber: string

  @ApiProperty({ description: '采购详情列表', type: [PurchaseDetailInput] })
  @IsArray({ message: '采购详情必须为数组' })
  @ArrayMinSize(1, { message: '至少需要一条采购详情' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseDetailInput)
  purchaseDetails: PurchaseDetailInput[]
}
