/**
 * 本文件用于定义 CASL 权限策略
 * 目的是为了限制每个不同用户在数据层的行为和数据范围
 */

import { AbilityBuilder } from '@casl/ability'
import { createPrismaAbility } from '@casl/prisma'
import { BaseRole } from '@prisma/client'
import _ from 'lodash'
import { ReqUser } from 'src/modules/sys_auth/types/request'
import { Actions, AppAbility } from './casl-interface'

export default function defineAbilityFor(user: ReqUser) {
  const abilityBuilder = new AbilityBuilder<AppAbility>(createPrismaAbility)
  // 超管权限
  if (user.roles.some((r) => r.name === BaseRole.SUPER_ADMIN)) {
    abilityBuilder.can(Actions.Manage, 'all')
    return abilityBuilder.build()
  }
  // 数据范围
  const permissions = user.roles.flatMap((r) => r.permissions)
  const models = _.uniq(permissions.map((p) => p.model))
  models.forEach((model) => {
    switch (model) {
      case 'User':
        handleUserAbility(abilityBuilder, user)
        break
      default:
        break
    }
  })
  return abilityBuilder.build()
}

/**
 * 处理用户权限
 * @param builder
 * @param user
 */
function handleUserAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  builder.can(Actions.Manage, 'User', { createdById: user.id }) // 允许管理自己创建的账号
  builder.can([Actions.Read, Actions.Update], 'User', { id: user.id }) // 允许查看和更新自己的账号
}
