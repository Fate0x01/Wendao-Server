import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PermissionEntity } from './permission.entity'

export class RoleEntity {
  @ApiProperty({ description: '角色ID' })
  id: string

  @ApiProperty({ description: '角色名称' })
  name: string

  @ApiPropertyOptional({ description: '角色描述', nullable: true })
  desc?: string | null

  @ApiProperty({ description: '是否禁用' })
  disabled: boolean

  @ApiProperty({ description: '系统角色' })
  isSystem: boolean

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date

  @ApiProperty({ description: '权限列表', type: [PermissionEntity] })
  permissions: PermissionEntity[]
}
