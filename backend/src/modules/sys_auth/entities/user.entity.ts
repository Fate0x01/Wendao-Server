import { ApiProperty } from '@nestjs/swagger'

export class UserProfile {
  @ApiProperty({ description: '用户ID' })
  id: number

  @ApiProperty({ description: '用户名' })
  username: string
}
