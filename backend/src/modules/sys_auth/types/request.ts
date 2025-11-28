import { Prisma } from '@prisma/client'
import { Request } from 'express'

// 请求上下文中的用户对象类型
export type ReqUser = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        permissions: true
      }
    }
  }
}>

// 请求上下文的基础类型
export interface ReqContext extends Request {
  user: ReqUser
  ip: string
}
