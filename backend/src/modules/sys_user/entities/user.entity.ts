import { ApiProperty } from '@nestjs/swagger'
import { RoleEntity } from '../../sys_role/entities/role.entity'

export class UserEntity {
  @ApiProperty({ description: '用户ID' })
  id: string

  @ApiProperty({ description: '用户名' })
  username: string

  @ApiProperty({ description: '是否禁用' })
  disabled: boolean

  @ApiProperty({ description: '创建人ID', nullable: true })
  createdById?: string | null

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date

  @ApiProperty({ description: '角色列表', type: [RoleEntity] })
  roles: RoleEntity[]
}
