import { Module } from '@nestjs/common'
import { APP_GUARD, DiscoveryModule } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { SysUserModule } from '../sys_user/sys_user.module'
import { JwtAuthGuard } from './jwt.guard'
import { JwtStrategy } from './jwt.strategy'
import { PermissionGuard } from './permission.guard'
import { PermissionScanner } from './permission.scanner'
import { SysAuthController } from './sys_auth.controller'
import { SysAuthService } from './sys_auth.service'

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } }), SysUserModule, DiscoveryModule],
  controllers: [SysAuthController],
  providers: [
    SysAuthService,
    JwtStrategy,
    PermissionScanner,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 令牌守卫
    { provide: APP_GUARD, useClass: PermissionGuard }, // 权限守卫
  ],
  exports: [PermissionScanner],
})
export class SysAuthModule {}
