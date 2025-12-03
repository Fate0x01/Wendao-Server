import { Module } from '@nestjs/common'
import { SysGoodsController } from './sys_goods.controller'
import { SysGoodsService } from './sys_goods.service'

@Module({
  controllers: [SysGoodsController],
  providers: [SysGoodsService],
  exports: [SysGoodsService],
})
export class SysGoodsModule {}

