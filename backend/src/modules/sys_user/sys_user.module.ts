import { Module } from '@nestjs/common'
import { SysUserController } from './sys_user.controller'
import { SysUserService } from './sys_user.service'

@Module({
  controllers: [SysUserController],
  providers: [SysUserService],
  exports: [SysUserService],
})
export class SysUserModule {}
