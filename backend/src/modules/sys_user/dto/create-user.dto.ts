import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsOptional, IsString, Length } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ description: '用户名', minLength: 2, maxLength: 16 })
  @IsString({ message: '用户名必须为字符串' })
  @Length(2, 16, { message: '用户名长度需在2到16个字符之间' })
  username: string

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 16 })
  @IsString({ message: '密码必须为字符串' })
  @Length(6, 16, { message: '密码长度需在6到16个字符之间' })
  password: string

  @ApiPropertyOptional({ description: '是否禁用', default: false })
  @IsOptional()
  @IsBoolean({ message: '禁用状态必须为布尔值' })
  disabled?: boolean

  @ApiPropertyOptional({ description: '关联角色ID', type: [String] })
  @IsOptional()
  @IsArray({ message: '角色ID必须为数组' })
  @IsString({ each: true, message: '角色ID必须为字符串' })
  roleIds?: string[]
}
