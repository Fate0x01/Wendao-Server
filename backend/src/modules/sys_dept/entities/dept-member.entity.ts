import { ApiProperty } from '@nestjs/swagger'

export class DeptMemberEntity {
  @ApiProperty({ description: '用户ID', type: String })
  id: string

  @ApiProperty({ description: '用户名', type: String })
  username: string

  @ApiProperty({ description: '是否禁用', type: Boolean })
  disabled: boolean

  @ApiProperty({ description: '是否为负责人', type: Boolean })
  isLeader: boolean

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date
}

