import { InjectRedis } from '@nestjs-modules/ioredis'
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import Redis from 'ioredis'
import { PrismaService } from 'nestjs-prisma'
import { getRefreshTokenKey, getUserInfoKey } from 'src/common/constant/redis.constant'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ReqContext } from './types/request'

@Injectable()
export class SysAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional()
    @InjectRedis()
    private readonly redisService?: Redis,
  ) {}

  /**
   * 生成鉴权令牌
   * @param loginDto 登录信息
   */
  async generateToken(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: loginDto.username } })
    if (!user) throw new UnauthorizedException('用户名或密码错误')
    if (user.disabled) throw new UnauthorizedException('账号已被禁用')
    const verify = await bcrypt.compare(loginDto.password, user.password)
    if (!verify) throw new UnauthorizedException('用户名或密码错误')
    return this.signWithRefresh(user.id, user.username)
  }

  /**
   * 刷新鉴权令牌
   * @param dto 刷新令牌
   */
  async refreshToken(dto: RefreshTokenDto) {
    const payload = this.verifyRefreshToken(dto.refresh_token)
    await this.ensureRefreshTokenActive(payload.id, dto.refresh_token)
    const user = await this.prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || user.disabled) throw new UnauthorizedException('登录状态失效')
    return this.signWithRefresh(user.id, user.username)
  }

  /**
   * 获取用户信息
   * @param req 请求对象
   */
  async getUserInfo(req: ReqContext) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, omit: { password: true } })
    return user
  }

  /**
   * 获取用户角色组
   * @param req 请求对象
   */
  async getUserRoles(req: ReqContext) {
    const roles = await this.prisma.role.findMany({
      where: { users: { some: { id: req.user.id } }, disabled: false },
      include: { permissions: true },
      orderBy: { createdAt: 'desc' },
    })
    return roles
  }

  /** 签发访问令牌与刷新令牌 */
  private async signWithRefresh(id: string, username: string) {
    // 清除用户信息缓存，确保下次鉴权时获取最新权限
    await this.clearUserInfoCache(id)
    const sessionId = randomUUID()
    const accessPayload = { id, username, type: 'access', sid: sessionId }
    const refreshPayload = { id, username, type: 'refresh', sid: sessionId }
    const access_token = this.jwtService.sign(accessPayload, { secret: this.jwtSecret, expiresIn: this.accessExpiresIn })
    const refresh_token = this.jwtService.sign(refreshPayload, { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn })
    await this.cacheRefreshToken(id, refresh_token)
    return {
      access_token,
      refresh_token,
      expires_in: this.accessExpiresInSeconds,
      refresh_expires_in: this.refreshExpiresInSeconds,
    }
  }

  /** 校验刷新令牌签名与类型 */
  private verifyRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{ id: string; username: string; type?: string }>(token, {
        secret: this.refreshSecret,
      })
      if (payload.type !== 'refresh') throw new UnauthorizedException('刷新令牌类型错误')
      return payload
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException('刷新令牌已失效')
    }
  }

  /** Redis 校验刷新令牌状态（无 Redis 时退化为纯校验签名） */
  private async ensureRefreshTokenActive(userId: string, refreshToken: string) {
    if (!this.redisService) return
    const cached = await this.redisService.get(getRefreshTokenKey(userId))
    if (!cached) throw new UnauthorizedException('刷新令牌已失效')
    const matched = await bcrypt.compare(refreshToken, cached)
    if (!matched) throw new UnauthorizedException('刷新令牌已失效')
  }

  /** 缓存刷新令牌哈希，便于后续旋转与失效控制 */
  private async cacheRefreshToken(userId: string, refreshToken: string) {
    if (!this.redisService) return
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.redisService.set(getRefreshTokenKey(userId), hashed, 'EX', this.refreshExpiresInSeconds)
  }

  /** 清除用户信息缓存 */
  private async clearUserInfoCache(userId: string) {
    if (!this.redisService) return
    await this.redisService.del(getUserInfoKey(userId))
  }

  /** 将过期时间转换为秒（支持 s/m/h/d） */
  private toSeconds(value: string | number, fallback: number) {
    if (typeof value === 'number') return value
    const matched = /^([0-9]+)([smhd])?$/.exec(value)
    if (!matched) return fallback
    const amount = Number(matched[1])
    const unit = matched[2] || 's'
    const unitMap = { s: 1, m: 60, h: 60 * 60, d: 60 * 60 * 24 }
    return amount * unitMap[unit]
  }

  private get jwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET')
    if (!secret) throw new Error('JWT_SECRET 未配置')
    return secret
  }

  private get refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || this.jwtSecret
  }

  private get accessExpiresIn() {
    return this.configService.get<string>('JWT_EXPIRES_IN') || '7d'
  }

  private get refreshExpiresIn() {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d'
  }

  private get accessExpiresInSeconds() {
    return this.toSeconds(this.accessExpiresIn, 60 * 60 * 24 * 7)
  }

  private get refreshExpiresInSeconds() {
    return this.toSeconds(this.refreshExpiresIn, 60 * 60 * 24 * 30)
  }
}
