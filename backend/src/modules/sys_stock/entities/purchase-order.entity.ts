import { ApiProperty } from '@nestjs/swagger'
import { PurchaseDetailEntity } from './purchase-detail.entity'

export class PurchaseOrderEntity {
  @ApiProperty({ description: '采购订单ID', type: String })
  id: string

  @ApiProperty({ description: '采购批次号', type: String })
  purchaseBatchNumber: string

  @ApiProperty({ description: '部门确认状态', type: Boolean })
  departmentConfirmStatus: boolean

  @ApiProperty({ description: '财务确认状态', type: Boolean })
  financeConfirmStatus: boolean

  @ApiProperty({ description: '创建时间', type: String })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String })
  updatedAt: Date

  @ApiProperty({ description: '采购详情', type: [PurchaseDetailEntity] })
  purchaseDetails: PurchaseDetailEntity[]
}
