import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class DeptIdDto {
  @ApiProperty({ description: '部门ID', type: String })
  @IsString({ message: '部门ID必须为字符串' })
  id: string
}

