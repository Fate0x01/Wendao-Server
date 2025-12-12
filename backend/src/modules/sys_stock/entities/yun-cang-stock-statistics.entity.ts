import { ApiProperty } from '@nestjs/swagger'

export class YunCangStockStatisticsEntity {
  @ApiProperty({ description: '总库存数量', type: Number })
  totalStockQuantity: number

  @ApiProperty({ description: '总日销量', type: Number })
  totalDailySalesQuantity: number

  @ApiProperty({ description: '总月销量', type: Number })
  totalMonthlySalesQuantity: number
}