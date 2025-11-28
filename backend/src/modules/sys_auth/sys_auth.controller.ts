import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from 'src/common/decorators/public.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import { RoleEntity } from '../sys_role/entities/role.entity'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { LoginEntity } from './entities/login.entity'
import { UserProfile } from './entities/user.entity'
import { SysAuthService } from './sys_auth.service'
import { ReqContext } from './types/request'

@ApiTags('认证')
@Controller('sys-auth')
export class SysAuthController {
  constructor(private readonly sysAuthService: SysAuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '登录账号' })
  @ApiResult(LoginEntity)
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return ResultData.ok(await this.sysAuthService.generateToken(loginDto))
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '刷新令牌' })
  @ApiResult(LoginEntity)
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenDto) {
    return ResultData.ok(await this.sysAuthService.refreshToken(dto))
  }

  @Get('profile')
  @ApiOperation({ summary: '个人信息' })
  @ApiResult(UserProfile)
  async getUserInfo(@Req() req: ReqContext) {
    return ResultData.ok(await this.sysAuthService.getUserInfo(req))
  }

  @Get('permissions')
  @ApiOperation({ summary: '个人权限' })
  @ApiResult(RoleEntity, true)
  async getUserPermissions(@Req() req: ReqContext) {
    return ResultData.ok(await this.sysAuthService.getUserRoles(req))
  }
}
