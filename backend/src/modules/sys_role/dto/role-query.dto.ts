import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class RoleQueryDto {
  @ApiProperty({ description: '当前页', default: 1, type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: 'current 必须为数字' })
  @Min(1, { message: 'current 最小为 1' })
  current = 1

  @ApiProperty({ description: '每页数量', default: 10, type: Number })
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须为数字' })
  @Min(1, { message: 'pageSize 最小为 1' })
  pageSize = 10

  @ApiPropertyOptional({ description: '角色名称关键词' })
  @IsOptional()
  @IsString({ message: '关键词必须为字符串' })
  keywords?: string

  @ApiPropertyOptional({ description: '是否禁用' })
  @IsOptional()
  @IsBoolean({ message: '禁用状态必须为布尔值' })
  disabled?: boolean

  @ApiPropertyOptional({ description: '权限ID筛选' })
  @IsOptional()
  @IsString({ message: '权限ID必须为字符串' })
  permissionId?: string
}
