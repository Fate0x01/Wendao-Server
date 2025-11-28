import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { UpdateUserDto } from './update-user.dto'

export class UpdateUserBodyDto extends UpdateUserDto {
  @ApiProperty({ description: '用户ID' })
  @IsString({ message: '用户ID必须为字符串' })
  id: string
}
