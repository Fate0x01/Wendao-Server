import { Module } from '@nestjs/common'
import { SysStockController } from './sys_stock.controller'
import { SysStockService } from './sys_stock.service'

@Module({
  controllers: [SysStockController],
  providers: [SysStockService],
  exports: [SysStockService],
})
export class SysStockModule {}

