import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LockService } from './lock.service'
import { QUEUE_NAME } from './processor'
import { SysTasksController } from './sys_tasks.controller'
import { TaskService } from './sys_tasks.service'

@Global()
@Module({
  imports: [
    /**
     * 注册 Bull 模块
     */
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
        },
      }),
      inject: [ConfigService],
    }),
    /**
     * 注册默认任务队列
     */
    BullModule.registerQueue({
      name: QUEUE_NAME.Common,
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 100 }, // 完成任务保留1小时，最多保留100个
        removeOnFail: 3, // 最大保留3个失败任务
        attempts: 3, // 异常任务最大重试次数
        backoff: {
          type: 'exponential', // 指数退避策略
          delay: 1000 * 60, // 初始延迟1分钟
        },
      },
    }),
  ],
  controllers: [SysTasksController],
  providers: [TaskService, LockService],
  exports: [TaskService, LockService],
})
export class SysTasksModule {}
