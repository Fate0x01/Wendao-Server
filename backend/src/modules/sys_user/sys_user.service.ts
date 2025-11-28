import { ForbiddenException, Injectable } from '@nestjs/common'
import { ReqUser } from '../sys_auth/types/request'

@Injectable()
export class SysUserService {
  /**
   * 检查用户状态是否正常
   * @param user 请求来源用户
   * @returns 是否正常
   */
  checkUser(user: ReqUser): boolean {
    if (user.disabled) throw new ForbiddenException('用户已被禁用')
    if (user.roles.every((r) => r.disabled)) throw new ForbiddenException('角色已被禁用')
    return true
  }
}
