import { PureAbility } from '@casl/ability'
import { PrismaQuery, Subjects } from '@casl/prisma'
import { Department, GoodChangeLog, Goods, JingCangStockInfo, Permission, PurchaseDetail, PurchaseOrder, Role, User, YunCangStockInfo } from '@prisma/client'

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
  YunCangStockInfo: YunCangStockInfo
  PurchaseOrder: PurchaseOrder
  PurchaseDetail: PurchaseDetail
}

export type AppAbility = PureAbility<[Actions, 'all' | Subjects<CaslModels>], PrismaQuery>
