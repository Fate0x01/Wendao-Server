import { Inject } from '@nestjs/common'
import { CustomPrismaService } from 'nestjs-prisma'
import { ExtendedPrismaClient } from './prisma.extension'

/**
 * 自定义Prisma装饰器
 * 用于简化注入CustomPrisma服务
 */
export const NestPrisma = (): ParameterDecorator => {
  return Inject('CustomPrisma')
}

/**
 * 自定义Prisma服务类型
 */
export type NestPrismaServiceType = CustomPrismaService<ExtendedPrismaClient>
