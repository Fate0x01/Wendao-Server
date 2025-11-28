import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator'

export class UpdateDeptDto {
  @ApiProperty({ description: '部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  id: string

  @ApiPropertyOptional({ description: '部门名称', minLength: 2, maxLength: 32, type: String })
  @IsOptional()
  @IsString({ message: '部门名称必须为字符串' })
  @Length(2, 32, { message: '部门名称长度需在2到32个字符之间' })
  name?: string

  @ApiPropertyOptional({ description: '部门描述', type: String })
  @IsOptional()
  @IsString({ message: '部门描述必须为字符串' })
  description?: string

  @ApiPropertyOptional({ description: '是否禁用', type: Boolean })
  @IsOptional()
  @IsBoolean({ message: '禁用状态必须为布尔值' })
  disabled?: boolean
}

