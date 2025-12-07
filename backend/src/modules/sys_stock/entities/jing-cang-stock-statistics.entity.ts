import { ApiProperty } from '@nestjs/swagger'

export class JingCangStockStatisticsEntity {
  @ApiProperty({ description: '总日销量', type: Number })
  totalDailySalesQuantity: number

  @ApiProperty({ description: '总月销量', type: Number })
  totalMonthlySalesQuantity: number

  @ApiProperty({ description: '进货成本总货值', type: Number })
  totalPurchaseCostValue: number
}

