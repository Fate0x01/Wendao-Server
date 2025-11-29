import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator'

export class LinkMemberDto {
  @ApiProperty({ description: '目标部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  departmentId: string

  @ApiProperty({ description: '用户ID列表', type: [String] })
  @IsArray({ message: 'userIds 必须为数组' })
  @IsString({ each: true, message: '用户ID必须为字符串' })
  userIds: string[]

  @ApiPropertyOptional({ description: '是否设为负责人', default: false, type: Boolean })
  @IsOptional()
  @IsBoolean({ message: 'isLeader 必须为布尔值' })
  isLeader?: boolean
}

