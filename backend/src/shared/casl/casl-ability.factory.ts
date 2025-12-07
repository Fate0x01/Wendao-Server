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
      case 'Department':
        handleDepartmentAbility(abilityBuilder, user)
        break
      case 'Goods':
        handleGoodsAbility(abilityBuilder, user)
        break
      case 'GoodChangeLog':
        handleGoodChangeLogAbility(abilityBuilder, user)
        break
      case 'JingCangStockInfo':
        handleJingCangStockAbility(abilityBuilder, user)
        break
      default:
        break
    }
  })
  return abilityBuilder.build()
}

/**
 * 处理用户权限
 * 权限规则：
 * - 一级部门负责人：读取/管理一级部门及其下二级部门的所有成员
 * - 二级部门负责人：读取/管理所负责的二级部门的所有成员
 * - 所有人：可以读取和更新自己的账号
 * @param builder
 * @param user
 */
function handleUserAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  // 获取用户负责的部门（区分一级和二级）
  const leadingDepts = user.leadingDepartments ?? []
  const leadingLevel1DeptIds: string[] = []
  const leadingLevel2DeptIds: string[] = []

  for (const dept of leadingDepts) {
    if (dept.parentId === null) {
      leadingLevel1DeptIds.push(dept.id)
    } else {
      leadingLevel2DeptIds.push(dept.id)
    }
  }

  // 允许管理自己创建的账号
  builder.can(Actions.Manage, 'User', { createdById: user.id })

  // 一级部门负责人：可以管理一级部门的成员，以及所有子部门的成员
  if (leadingLevel1DeptIds.length > 0) {
    // 一级部门的直接成员
    builder.can(Actions.Manage, 'User', { departments: { some: { id: { in: leadingLevel1DeptIds } } } })
    // 一级部门下属二级部门的成员
    builder.can(Actions.Manage, 'User', { departments: { some: { parentId: { in: leadingLevel1DeptIds } } } })
  }

  // 二级部门负责人：可以管理所负责的二级部门的成员
  if (leadingLevel2DeptIds.length > 0) {
    builder.can(Actions.Manage, 'User', { departments: { some: { id: { in: leadingLevel2DeptIds } } } })
  }

  // 允许查看和更新自己的账号
  builder.can([Actions.Read, Actions.Update], 'User', { id: user.id })
}

/**
 * 处理部门权限
 * 权限规则：
 * - 一级部门负责人（NORMAL_ADMIN）：管理本一级部门及其所有子部门
 * - 二级部门负责人（DEPARTMENT_LEADER）：仅管理本二级部门
 * - 二级部门成员（DEPARTMENT_MEMBER）：仅读取本二级部门
 * @param builder
 * @param user
 */
function handleDepartmentAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  // 获取用户负责的部门列表（包含层级信息）
  const leadingDepts = user.leadingDepartments ?? []
  // 获取用户所属的部门 ID 列表
  const memberDeptIds = user.departments?.map((d) => d.id) ?? []
  // 分离一级部门负责和二级部门负责
  const leadingLevel1DeptIds: string[] = []
  const leadingLevel2DeptIds: string[] = []

  for (const dept of leadingDepts) {
    if (dept.parentId === null) {
      leadingLevel1DeptIds.push(dept.id) // 一级部门
    } else {
      leadingLevel2DeptIds.push(dept.id) // 二级部门
    }
  }

  // 一级部门负责人：可以管理本一级部门及其所有子部门
  if (leadingLevel1DeptIds.length > 0) {
    builder.can(Actions.Manage, 'Department', { id: { in: leadingLevel1DeptIds } })
    builder.can(Actions.Manage, 'Department', { parentId: { in: leadingLevel1DeptIds } })
  }

  // 二级部门负责人：仅管理本二级部门
  if (leadingLevel2DeptIds.length > 0) {
    builder.can(Actions.Manage, 'Department', { id: { in: leadingLevel2DeptIds } })
  }

  // 部门成员：仅读取本部门
  if (memberDeptIds.length > 0) {
    builder.can(Actions.Read, 'Department', { id: { in: memberDeptIds } })
  }
}

/**
 * 处理商品权限
 * 权限规则：
 * - 一级部门负责人：管理本一级部门及其所有子部门的商品
 * - 二级部门负责人：仅管理本二级部门的商品
 * - 二级部门成员：仅读取本二级部门的商品
 * @param builder
 * @param user
 */
function handleGoodsAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  // 获取用户负责的部门列表（包含层级信息）
  const leadingDepts = user.leadingDepartments ?? []
  // 获取用户所属的部门 ID 列表
  const memberDeptIds = user.departments?.map((d) => d.id) ?? []
  // 分离一级部门负责和二级部门负责
  const leadingLevel1DeptIds: string[] = []
  const leadingLevel2DeptIds: string[] = []

  for (const dept of leadingDepts) {
    if (dept.parentId === null) {
      leadingLevel1DeptIds.push(dept.id) // 一级部门
    } else {
      leadingLevel2DeptIds.push(dept.id) // 二级部门
    }
  }

  // 一级部门负责人：可以管理本一级部门及其所有子部门的商品
  if (leadingLevel1DeptIds.length > 0) {
    builder.can(Actions.Manage, 'Goods', { departmentId: { in: leadingLevel1DeptIds } })
    // 一级部门下属二级部门的商品
    builder.can(Actions.Manage, 'Goods', { department: { parentId: { in: leadingLevel1DeptIds } } })
  }

  // 二级部门负责人：仅管理本二级部门的商品
  if (leadingLevel2DeptIds.length > 0) {
    builder.can(Actions.Manage, 'Goods', { departmentId: { in: leadingLevel2DeptIds } })
  }

  // 部门成员：仅读取本部门的商品
  if (memberDeptIds.length > 0) {
    builder.can(Actions.Manage, 'Goods', { departmentId: { in: memberDeptIds } })
  }
}

/**
 * 处理商品变动日志权限
 * 权限规则：跟随商品权限
 * @param builder
 * @param user
 */
function handleGoodChangeLogAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  const leadingDepts = user.leadingDepartments ?? []
  const memberDeptIds = user.departments?.map((d) => d.id) ?? []
  const leadingLevel1DeptIds: string[] = []
  const leadingLevel2DeptIds: string[] = []

  for (const dept of leadingDepts) {
    if (dept.parentId === null) {
      leadingLevel1DeptIds.push(dept.id)
    } else {
      leadingLevel2DeptIds.push(dept.id)
    }
  }

  // 一级部门负责人
  if (leadingLevel1DeptIds.length > 0) {
    builder.can(Actions.Manage, 'GoodChangeLog', { good: { departmentId: { in: leadingLevel1DeptIds } } })
    builder.can(Actions.Manage, 'GoodChangeLog', { good: { department: { parentId: { in: leadingLevel1DeptIds } } } })
  }

  // 二级部门负责人
  if (leadingLevel2DeptIds.length > 0) {
    builder.can(Actions.Manage, 'GoodChangeLog', { good: { departmentId: { in: leadingLevel2DeptIds } } })
  }

  // 部门成员
  if (memberDeptIds.length > 0) {
    builder.can(Actions.Manage, 'GoodChangeLog', { good: { departmentId: { in: memberDeptIds } } })
  }
}

/**
 * 处理京仓库存信息权限
 * 权限规则：
 * - 一级部门负责人：可管理本部门及其下属二级部门的商品对应的京仓库存
 * - 二级部门负责人：可管理本二级部门的商品对应的京仓库存
 * - 部门成员：仅可管理本部门的商品对应的京仓库存
 * @param builder
 * @param user
 */
function handleJingCangStockAbility(builder: AbilityBuilder<AppAbility>, user: ReqUser) {
  const leadingDepts = user.leadingDepartments ?? []
  const memberDeptIds = user.departments?.map((d) => d.id) ?? []
  const leadingLevel1DeptIds: string[] = []
  const leadingLevel2DeptIds: string[] = []

  for (const dept of leadingDepts) {
    if (dept.parentId === null) {
      leadingLevel1DeptIds.push(dept.id)
    } else {
      leadingLevel2DeptIds.push(dept.id)
    }
  }

  // 一级部门负责人
  if (leadingLevel1DeptIds.length > 0) {
    // 管理本部门
    builder.can(Actions.Manage, 'JingCangStockInfo', { good: { departmentId: { in: leadingLevel1DeptIds } } })
    // 管理下属二级部门
    builder.can(Actions.Manage, 'JingCangStockInfo', { good: { department: { parentId: { in: leadingLevel1DeptIds } } } })
  }

  // 二级部门负责人
  if (leadingLevel2DeptIds.length > 0) {
    builder.can(Actions.Manage, 'JingCangStockInfo', { good: { departmentId: { in: leadingLevel2DeptIds } } })
  }

  // 部门成员
  if (memberDeptIds.length > 0) {
    builder.can(Actions.Manage, 'JingCangStockInfo', { good: { departmentId: { in: memberDeptIds } } })
  }
}
