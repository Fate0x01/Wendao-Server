import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class MembersQueryDto {
  @ApiProperty({ description: '部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  departmentId: string

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

  @ApiPropertyOptional({ description: '用户名关键词', type: String })
  @IsOptional()
  @IsString({ message: '关键词必须为字符串' })
  keywords?: string
}

