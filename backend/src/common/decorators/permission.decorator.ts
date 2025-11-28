/*
	主要用于在控制器使用，定义该控制器涉及了什么权限
	Example: @Permission({ group: '用户', name: '删除用户', code: 'user:delete' })
*/

import { SetMetadata } from '@nestjs/common'
import { CaslModels } from 'src/shared/casl/casl-interface'

export const PERMISSION_KEY = 'permissions'

export type PermissionValue = {
  group: string // 权限分组
  name: string // 权限名称
  model?: keyof CaslModels // 权限模型
  code: string // 权限代码
}

export function Permission(...permissions: PermissionValue[]) {
  return SetMetadata(PERMISSION_KEY, permissions)
}
