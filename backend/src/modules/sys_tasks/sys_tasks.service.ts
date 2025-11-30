import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'
import { TaskProgressEntity, TaskStatusEntity } from './entities/status.entity'
import { QUEUE_NAME } from './processor'

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(@InjectQueue(QUEUE_NAME.Common) private readonly commonQueue: Queue) {}

  async onModuleInit() {
    // TODO: Not implemented
  }

  /**
   * 获取任务状态
   * @param jobId 任务 ID
   * @returns 任务状态信息
   */
  async getTaskStatus(jobId: string): Promise<TaskStatusEntity> {
    const job = await this.commonQueue.getJob(jobId)
    if (!job) throw new NotFoundException('任务不存在或已过期')
    const state = await job.getState()
    return {
      id: job.id,
      status: state,
      progress: job.progress as TaskProgressEntity,
      error: job.failedReason,
      timestamps: {
        added: job.timestamp,
        processed: job.processedOn,
        finished: job.finishedOn,
      },
    }
  }
}
