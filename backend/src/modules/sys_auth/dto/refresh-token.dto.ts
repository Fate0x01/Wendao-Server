import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsString({ message: '刷新令牌格式错误' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refresh_token: string
}
