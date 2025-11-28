import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { BaseRole } from '@prisma/client'
import { PERMISSION_KEY, PermissionValue } from 'src/common/decorators/permission.decorator'
import { SysUserService } from '../sys_user/sys_user.service'
import { ReqContext } from './types/request'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sysUserService: SysUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取请求上下文
    const request = context.switchToHttp().getRequest<ReqContext>()
    // 获取当前路由的权限装饰器元数据
    const permission = this.reflector.get<PermissionValue[]>(PERMISSION_KEY, context.getHandler())
    if (!permission) return true
    // 基础状态检查
    this.sysUserService.checkUser(request.user)
    // 角色检查：超管允许访问所有资源
    if (request.user.roles.some((r) => r.name === BaseRole.SUPER_ADMIN)) return true
    // 权限检查：检查用户的某个角色是否拥有所需权限
    const hasPermission = permission.every((p) => request.user.roles.some((role) => role.permissions.some((perm) => perm.code === p.code)))
    if (!hasPermission) {
      throw new ForbiddenException('权限不足')
    }
    return true
  }
}
