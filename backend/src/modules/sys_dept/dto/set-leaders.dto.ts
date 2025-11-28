import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'

export class SetLeadersDto {
  @ApiProperty({ description: '部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  departmentId: string

  @ApiProperty({ description: '负责人用户ID列表', type: [String] })
  @IsArray({ message: '负责人列表必须为数组' })
  @IsString({ each: true, message: '用户ID必须为字符串' })
  leaderIds: string[]
}

