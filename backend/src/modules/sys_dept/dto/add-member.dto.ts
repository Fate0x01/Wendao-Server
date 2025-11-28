import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator'

export class AddMemberDto {
  @ApiProperty({ description: '用户名', minLength: 2, maxLength: 16, type: String })
  @IsString({ message: '用户名必须为字符串' })
  @Length(2, 16, { message: '用户名长度需在2到16个字符之间' })
  username: string

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 16, type: String })
  @IsString({ message: '密码必须为字符串' })
  @Length(6, 16, { message: '密码长度需在6到16个字符之间' })
  password: string

  @ApiProperty({ description: '目标部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  departmentId: string

  @ApiPropertyOptional({ description: '是否设为负责人', default: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: 'isLeader 必须为布尔值' })
  isLeader?: boolean
}

