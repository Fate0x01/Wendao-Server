import { Module } from '@nestjs/common'
import { SysDeptController } from './sys_dept.controller'
import { SysDeptService } from './sys_dept.service'

@Module({
  controllers: [SysDeptController],
  providers: [SysDeptService],
  exports: [SysDeptService],
})
export class SysDeptModule {}

