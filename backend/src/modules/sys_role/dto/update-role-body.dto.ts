import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { UpdateRoleDto } from './update-role.dto'

export class UpdateRoleBodyDto extends UpdateRoleDto {
  @ApiProperty({ description: '角色ID' })
  @IsString({ message: '角色ID必须为字符串' })
  id: string
}
