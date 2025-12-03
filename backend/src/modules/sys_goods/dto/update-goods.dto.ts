import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'

export class UpdateGoodsDto {
  @ApiProperty({ description: '商品ID', type: String })
  @IsString({ message: '商品ID必须为字符串' })
  id: string

  @ApiPropertyOptional({ description: '关联部门ID', type: String })
  @IsOptional()
  @IsString({ message: '部门ID必须为字符串' })
  departmentId?: string

  @ApiPropertyOptional({ description: '店铺名称', type: String })
  @IsOptional()
  @IsString({ message: '店铺名称必须为字符串' })
  shopName?: string

  @ApiPropertyOptional({ description: 'SKU字符串数组', type: Array })
  @IsOptional()
  @IsArray({ message: 'SKU必须为数组' })
  sku?: string[]

  @ApiPropertyOptional({ description: '货架号', type: String })
  @IsOptional()
  @IsString({ message: '货架号必须为字符串' })
  shelfNumber?: string

  @ApiPropertyOptional({ description: '产品图片', type: String })
  @IsOptional()
  @IsString({ message: '产品图片必须为字符串' })
  imageUrl?: string

  @ApiPropertyOptional({ description: '入仓条码', type: String })
  @IsOptional()
  @IsString({ message: '入仓条码必须为字符串' })
  inboundBarcode?: string

  @ApiPropertyOptional({ description: '产品规格', type: String })
  @IsOptional()
  @IsString({ message: '产品规格必须为字符串' })
  spec?: string

  @ApiPropertyOptional({ description: '合格证图', type: String })
  @IsOptional()
  @IsString({ message: '合格证图必须为字符串' })
  certificateImageUrl?: string

  @ApiPropertyOptional({ description: '进货成本', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '进货成本必须为数字' })
  @Min(0, { message: '进货成本不能小于0' })
  purchaseCost?: number

  @ApiPropertyOptional({ description: '最低售价', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '最低售价必须为数字' })
  @Min(0, { message: '最低售价不能小于0' })
  minSalePrice?: number

  @ApiPropertyOptional({ description: '快递费用', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '快递费用必须为数字' })
  @Min(0, { message: '快递费用不能小于0' })
  expressFee?: number

  @ApiPropertyOptional({ description: '耗材费', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '耗材费必须为数字' })
  @Min(0, { message: '耗材费不能小于0' })
  materialCost?: number

  @ApiPropertyOptional({ description: '销售出库费', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '销售出库费必须为数字' })
  @Min(0, { message: '销售出库费不能小于0' })
  salesOutboundFee?: number

  @ApiPropertyOptional({ description: 'TC 到仓费', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'TC 到仓费必须为数字' })
  @Min(0, { message: 'TC 到仓费不能小于0' })
  tcToWarehouseFee?: number

  @ApiPropertyOptional({ description: '人工打包费', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '人工打包费必须为数字' })
  @Min(0, { message: '人工打包费不能小于0' })
  manualPackingFee?: number

  @ApiPropertyOptional({ description: '交易服务费比例', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '交易服务费比例必须为数字' })
  @Min(0, { message: '交易服务费比例不能小于0' })
  transactionServiceRatio?: number

  @ApiPropertyOptional({ description: '佣金比例', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '佣金比例必须为数字' })
  @Min(0, { message: '佣金比例不能小于0' })
  commissionRatio?: number

  @ApiPropertyOptional({ description: '平台推广比例', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '平台推广比例必须为数字' })
  @Min(0, { message: '平台推广比例不能小于0' })
  platformPromotionRatio?: number

  @ApiPropertyOptional({ description: '货损比例', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '货损比例必须为数字' })
  @Min(0, { message: '货损比例不能小于0' })
  lossRatio?: number
}

