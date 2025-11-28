/**
 * 任务对象示例文件
 * 每个任务都应当在头部注释任务类型和重要逻辑说明
 */

import { BaseTask } from '../interface/base.interface'
import { IBaseTaskContext } from '../interface/context.interface'

export interface IExampleData {}
export interface IExampleContext extends IBaseTaskContext {}

export class ExampleTask extends BaseTask<IExampleData, IExampleContext> {
  async execute() {
    throw new Error('Not implemented')
  }
}
