import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 任务时间戳实体
 */
export class TaskTimestampsEntity {
  @ApiProperty({ description: '添加到队列的时间', type: Number })
  added: number

  @ApiPropertyOptional({ description: '开始处理的时间', type: Number, nullable: true })
  processed?: number

  @ApiPropertyOptional({ description: '处理结束的时间', type: Number, nullable: true })
  finished?: number
}

/**
 * 任务进度实体
 */
export class TaskProgressEntity {
  @ApiProperty({ description: '当前时间戳', type: Number })
  timestamp: number

  @ApiProperty({ description: '当前步骤信息', type: String })
  step: string

  @ApiProperty({ description: '当前进度百分比', type: Number })
  progress: number
}

/**
 * 任务状态实体
 */
export class TaskStatusEntity {
  @ApiPropertyOptional({ description: '任务 ID', type: String, nullable: true })
  id?: string

  @ApiProperty({
    description: '任务状态',
    type: String,
    enum: ['active', 'completed', 'failed', 'delayed', 'waiting', 'waiting-children', 'prioritized', 'unknown'],
  })
  status: string

  @ApiProperty({ description: '任务进度', type: TaskProgressEntity })
  progress: TaskProgressEntity

  @ApiPropertyOptional({ description: '任务失败的原因 (仅 failed 状态有值)', type: String, nullable: true })
  error?: string

  @ApiProperty({ description: '时间戳信息', type: TaskTimestampsEntity })
  timestamps: TaskTimestampsEntity
}
