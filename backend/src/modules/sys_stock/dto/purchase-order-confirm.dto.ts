import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class PurchaseOrderConfirmDto {
  @ApiProperty({ description: '采购订单ID', type: String })
  @IsString({ message: '采购订单ID必须为字符串' })
  id: string
}
