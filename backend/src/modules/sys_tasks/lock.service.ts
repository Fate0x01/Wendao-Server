import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import Redlock from 'redlock'

@Injectable()
export class LockService {
  private redlock: Redlock

  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {
    this.redlock = new Redlock([redis], {
      driftFactor: 0.01, // 时间漂移因子（可以调整）
      retryCount: Infinity, // 无限重试，直到获取到锁
      retryDelay: 10000, // 每次重试的延迟时间（毫秒）
      retryJitter: 5000, // 重试的抖动范围（随机值，避免多个客户端同时重试）
    })
  }

  /**
   * 获取分布式锁
   * @param resource 锁定的资源名称
   */
  async acquireLock(resource: string) {
    try {
      const lock = await this.redlock.acquire([resource], 1000 * 60 * 15)
      return lock
    } catch (error) {
      throw new Error(`获取锁失败: ${error.message}`)
    }
  }
}
