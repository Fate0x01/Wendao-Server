import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsOptional, IsString, Length } from 'class-validator'

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', minLength: 2, maxLength: 30 })
  @IsString({ message: '角色名称必须为字符串' })
  @Length(2, 30, { message: '角色名称长度需在2到30个字符之间' })
  name: string

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString({ message: '角色描述必须为字符串' })
  desc?: string

  @ApiPropertyOptional({ description: '是否禁用', default: false })
  @IsOptional()
  @IsBoolean({ message: '禁用状态必须为布尔值' })
  disabled?: boolean

  @ApiPropertyOptional({ description: '关联权限ID列表', type: [String] })
  @IsOptional()
  @IsArray({ message: '权限ID必须为数组' })
  @IsString({ each: true, message: '权限ID必须为字符串' })
  permissionIds?: string[]
}
