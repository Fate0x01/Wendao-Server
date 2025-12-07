import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable, Optional } from '@nestjs/common'
import Redis from 'ioredis'
import { getUserInfoKey } from 'src/common/constant/redis.constant'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { UpdateRoleBodyDto } from './dto/update-role-body.dto'

@Injectable()
export class SysRoleService {
  constructor(
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
    @Optional()
    @InjectRedis()
    private readonly redisService?: Redis,
  ) {}

  /**
   * 更新角色
   * @param dto 更新角色数据
   * @returns 更新后的角色信息
   */
  async updateRole(dto: UpdateRoleBodyDto) {
    // 如果权限发生变动，需要清除关联用户的缓存
    const shouldClearCache = dto.permissionIds !== undefined

    const role = await this.nestPrisma.client.role.update({
      where: { id: dto.id },
      data: {
        name: dto.name,
        desc: dto.desc,
        disabled: dto.disabled,
        ...(dto.permissionIds !== undefined ? { permissions: { set: dto.permissionIds.map((permissionId) => ({ id: permissionId })) } } : {}),
      },
      include: { permissions: true },
    })

    // 权限发生变动时，清除所有使用该角色的用户缓存
    if (shouldClearCache && this.redisService) {
      await this.clearUserCacheByRole(dto.id)
    }

    return role
  }

  /**
   * 清除使用指定角色的所有用户缓存
   * @param roleId 角色ID
   */
  private async clearUserCacheByRole(roleId: string): Promise<void> {
    if (!this.redisService) return
    // 查询所有使用该角色的用户
    const users = await this.nestPrisma.client.user.findMany({
      where: { roles: { some: { id: roleId } } },
      select: { id: true },
    })
    // 批量清除用户缓存
    if (users.length > 0) {
      const keys = users.map((user) => getUserInfoKey(user.id))
      await this.redisService.del(...keys)
    }
  }
}
