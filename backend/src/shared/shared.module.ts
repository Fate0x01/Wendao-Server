import { RedisModule } from '@nestjs-modules/ioredis'
import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ClsModule } from 'nestjs-cls'
import { CustomPrismaModule, PrismaModule } from 'nestjs-prisma'
import { SysTasksModule } from 'src/modules/sys_tasks/sys_tasks.module'
import { PrismaConfigService } from './prisma/prisma.config'
import { ExtendedPrismaConfigService } from './prisma/prisma.extended.service'
import { SharedService } from './shared.service'

@Global()
@Module({
  imports: [
    /**
     * 事件模块
     * 用于事件驱动机制
     * 参考项目：https://github.com/nestjs/nest/tree/master/sample/30-event-emitter
     */
    EventEmitterModule.forRoot(),
    /**
     * 导入任务调度模块
     * 方便使用 @nestjs/schedule 模块去执行各种定时任务
     */
    ScheduleModule.forRoot(),
    /**
     * 导入环境变量模块
     * 它内部自动读取.env文件中的配置
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    /**
     * Redis 缓存配置
     * 具体配置信息在 .env 文件中
     * 依赖模块：https://www.npmjs.com/package/@nestjs-modules/ioredis
     * 参考项目：https://github.com/87789771/meimei-nestjs-admin/blob/main/meimei-prisma-vue3/meimei-admin/src/shared/shared.module.ts
     */
    ...(process.env.REDIS_ENABLE === 'true'
      ? [
          // 注册 Redis 模块
          RedisModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
              const redis = {
                host: configService.get('REDIS_HOST'),
                port: configService.get('REDIS_PORT'),
                password: configService.get('REDIS_PASSWORD'),
                db: configService.get('REDIS_DB'),
              }
              return {
                type: 'single',
                url: `redis://:${redis.password}@${redis.host}:${redis.port}/${redis.db}`,
              }
            },
            imports: [ConfigModule],
            inject: [ConfigService],
          }),
          // 注册 Task 模块
          SysTasksModule,
        ]
      : []),
    /**
     * 把 Node.js 的 AsyncLocalStorage 能力封装成与 NestJS 依赖注入体系无缝结合的模块
     * 让「请求级上下文」可以在整个异步调用链中隐式传递，从而省掉手动层层传参的样板代码
     * AsyncLocalStorage: https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage
     */
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
    /**
     * 导入Prisma数据库模块, 使用类来加载，方便配置
     * mysql 数据库的配置文件在 .env中。 它内部自动读取。
     */
    PrismaModule.forRootAsync({
      isGlobal: true,
      useClass: PrismaConfigService,
    }),
    /**
     * 增加prisma扩展客户端，方便业务操作
     * 可以自定义各种数据库操作方法。
     * 可以在数据库操作前做参数修改，在查询后做结果修改。
     */
    CustomPrismaModule.forRootAsync({
      name: 'CustomPrisma',
      isGlobal: true,
      useClass: ExtendedPrismaConfigService,
    }),
  ],
  controllers: [],
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}
