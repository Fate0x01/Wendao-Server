import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RemoveMemberDto {
  @ApiProperty({ description: '部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  departmentId: string

  @ApiProperty({ description: '用户ID', type: String })
  @IsString({ message: '用户ID必须为字符串' })
  userId: string
}

