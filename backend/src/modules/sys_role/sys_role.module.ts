import { Module } from '@nestjs/common'
import { SysRoleController } from './sys_role.controller'
import { SysRoleService } from './sys_role.service'

@Module({
  controllers: [SysRoleController],
  providers: [SysRoleService],
  exports: [SysRoleService],
})
export class SysRoleModule {}
