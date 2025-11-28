import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PM2Instance } from 'src/common/decorators/pm2.decorator'
import { sleep } from 'src/common/utility/sleep.func'

@Injectable()
export class SharedService {
  constructor() {}

  @Cron(CronExpression.EVERY_10_SECONDS, { waitForCompletion: true })
  @PM2Instance(0) // TIP：如服务基于 PM2 集群部署，为避免重复运行，请指定实例ID
  async TestTask() {
    // TODO: 定时任务示例
    await sleep(10000)
  }

  async onModuleInit() {}
}
