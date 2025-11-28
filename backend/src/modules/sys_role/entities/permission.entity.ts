import { ApiProperty } from '@nestjs/swagger'

export class PermissionEntity {
  @ApiProperty({ description: '权限ID' })
  id: string

  @ApiProperty({ description: '权限分组' })
  group: string

  @ApiProperty({ description: '权限名称' })
  name: string

  @ApiProperty({ description: '权限代码' })
  code: string

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date
}
