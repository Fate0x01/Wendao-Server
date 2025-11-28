/**
 * 默认任务队列
 */

import { InjectRedis } from '@nestjs-modules/ioredis'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import Redis from 'ioredis'
import { PrismaService } from 'nestjs-prisma'
import { QUEUE_NAME } from '.'
import { IBaseTaskContext } from '../interface/context.interface'

@Processor(QUEUE_NAME.Common, { concurrency: 5 })
export class CommonProcessor extends WorkerHost {
  // 任务映射表
  private readonly taskMap = {}
  // 单例任务映射表
  private readonly singleTaskMap = {}

  constructor(
    private readonly prismaService: PrismaService,
    @InjectRedis() private readonly redisService: Redis,
  ) {
    super()
  }

  /**
   * 构建任务上下文
   * @returns {Object} 任务上下文
   */
  buildContext(): IBaseTaskContext {
    return {
      prismaService: this.prismaService,
      redisService: this.redisService,
    }
  }

  /**
   * 处理任务
   * @param job {Job} 任务
   * @returns {Promise<any>} 任务执行结果
   */
  async process(job: Job) {
    // -------------- 获取任务类型 --------------
    const context = this.buildContext()
    const TaskClass = this.taskMap[job.name]
    if (!TaskClass) throw new Error(`未找到任务执行器: ${job.name}`)
    // -------------- 检查单例任务 --------------
    if (this.singleTaskMap[job.name] === true) return
    try {
      // -------------- 标记单例任务开始 --------------
      if (job.name in this.singleTaskMap) this.singleTaskMap[job.name] = true
      // -------------- 执行任务 --------------
      const task = new TaskClass(job, context)
      return await task.execute()
    } catch (error) {
      throw error
    } finally {
      if (job.name in this.singleTaskMap) this.singleTaskMap[job.name] = false // 重置单例任务状态
    }
  }
}
