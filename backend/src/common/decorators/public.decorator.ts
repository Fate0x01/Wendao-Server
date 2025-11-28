/*
 * 主要用于在控制器使用，定义该控制器不需要经过任何鉴权验证
 */

import { SetMetadata } from '@nestjs/common'
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
