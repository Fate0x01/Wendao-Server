import { Injectable } from '@nestjs/common'
import { CustomPrismaClientFactory } from 'nestjs-prisma'
import { type ExtendedPrismaClient, extendedPrismaClient } from './prisma.extension'

@Injectable()
export class ExtendedPrismaConfigService implements CustomPrismaClientFactory<ExtendedPrismaClient> {
  constructor() {
    // TIPS: inject any other service here like the `ConfigService`
  }

  createPrismaClient(): ExtendedPrismaClient {
    // TIPS: you could pass options to your `PrismaClient` instance here
    return extendedPrismaClient
  }
}
