import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import Redis from 'ioredis'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { getUserInfoKey } from 'src/common/constant/redis.constant'
import { ReqUser } from './types/request'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Optional()
    @InjectRedis()
    private readonly redisService: Redis,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
      ignoreExpiration: false,
    })
  }

  async validate({ id, type }: { id: string; type?: string }): Promise<ReqUser> {
    if (type && type !== 'access') throw new UnauthorizedException('令牌类型错误')
    const user = await this.getUser(id)
    if (!user || user.disabled) throw new UnauthorizedException('登录状态失效')
    this.cls.set('user', user)
    return user
  }

  /** 获取用户信息（优先从 Redis 缓存获取） */
  private async getUser(id: string): Promise<ReqUser | null> {
    // 尝试从 Redis 缓存获取
    if (this.redisService) {
      const cached = await this.redisService.get(getUserInfoKey(id))
      if (cached) return JSON.parse(cached)
    }
    // 从数据库查询
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { permissions: true },
        },
      },
    })
    // 写入 Redis 缓存
    if (user && this.redisService) {
      await this.redisService.set(getUserInfoKey(id), JSON.stringify(user), 'EX', 60 * 60 * 24)
    }
    return user
  }
}
