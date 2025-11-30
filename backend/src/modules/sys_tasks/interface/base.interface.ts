/*
 * @Author: 刘一缘
 * @Date: 2024-12-17 01:35:16
 * @FilePath: \app\src\modules\tasks\interface\base.task.ts
 * @Description: 任务基类
 */

import { Job } from 'bullmq'
import { IBaseTaskContext } from './context.interface'
import { IProgress } from './progress.interface'

export abstract class BaseTask<TData = unknown, TContext extends IBaseTaskContext = IBaseTaskContext> {
  constructor(
    protected readonly job: Job<TData, any, string>,
    protected context: TContext,
  ) {}

  /**
   * 执行任务
   */
  abstract execute(): Promise<any>

  /**
   * 更新任务进度
   * @param info 进度信息
   */
  protected async updateProgress(info: IProgress) {
    this.job.updateProgress(info)
  }

  /**
   * 获取任务数据
   * @template T 任务数据类型
   * @returns 任务数据
   */
  protected getData<T extends TData>(): T {
    return this.job.data as T
  }

  /**
   * 获取任务名称
   */
  protected getName(): string {
    return this.job.name
  }

  /**
   * 获取任务ID
   */
  protected getId(): string {
    return this.job.id
  }

  /**
   * 获取任务尝试次数
   */
  protected getAttempts(): number {
    return this.job.attemptsMade
  }
}
