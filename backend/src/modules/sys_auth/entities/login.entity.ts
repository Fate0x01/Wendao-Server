import { ApiProperty } from '@nestjs/swagger'

export class LoginEntity {
  @ApiProperty({ description: '鉴权令牌' })
  access_token: string

  @ApiProperty({ description: '刷新令牌' })
  refresh_token: string

  @ApiProperty({ description: '鉴权令牌有效期（秒）' })
  expires_in: number

  @ApiProperty({ description: '刷新令牌有效期（秒）' })
  refresh_expires_in: number
}
