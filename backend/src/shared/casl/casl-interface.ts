import { PureAbility } from '@casl/ability'
import { PrismaQuery, Subjects } from '@casl/prisma'
import { Department, GoodChangeLog, Goods, JingCangStockInfo, Permission, Role, User } from '@prisma/client'

export enum Actions {
  Manage = 'manage',
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export type CaslModels = {
  User: User
  Role: Role
  Permission: Permission
  Department: Department
  Goods: Goods
  GoodChangeLog: GoodChangeLog
  JingCangStockInfo: JingCangStockInfo
}

export type AppAbility = PureAbility<[Actions, 'all' | Subjects<CaslModels>], PrismaQuery>
