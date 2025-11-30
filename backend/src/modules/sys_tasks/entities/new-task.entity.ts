import { ApiProperty } from '@nestjs/swagger'

export class NewTaskEntity {
  @ApiProperty({ description: '任务 ID' })
  id: string
}
