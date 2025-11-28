import Redis from 'ioredis'
import { PrismaService } from 'nestjs-prisma'

export interface IBaseTaskContext {
  redisService: Redis
  prismaService: PrismaService
}
