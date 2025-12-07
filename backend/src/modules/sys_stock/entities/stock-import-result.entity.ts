import { ApiProperty } from '@nestjs/swagger'

export class StockImportResultEntity {
  @ApiProperty({ description: '成功数量' })
  success: number

  @ApiProperty({ description: '失败数量' })
  fail: number

  @ApiProperty({ description: '错误信息列表', type: [String] })
  errors: string[]
}

