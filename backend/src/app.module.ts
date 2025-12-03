import { Module } from '@nestjs/common'
import { SysAuthModule } from './modules/sys_auth/sys_auth.module'
import { SysDeptModule } from './modules/sys_dept/sys_dept.module'
import { SysGoodsModule } from './modules/sys_goods/sys_goods.module'
import { SysRoleModule } from './modules/sys_role/sys_role.module'
import { SysUserModule } from './modules/sys_user/sys_user.module'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [SharedModule, SysAuthModule, SysUserModule, SysRoleModule, SysDeptModule, SysGoodsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
