import { accessibleBy } from '@casl/prisma'
import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import * as bcrypt from 'bcryptjs'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import defineAbilityFor from 'src/shared/casl/casl-ability.factory'
import { Actions } from 'src/shared/casl/casl-interface'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserBodyDto } from './dto/update-user-body.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { UserEntity } from './entities/user.entity'

@ApiTags('系统用户')
@Controller('sys-user')
export class SysUserController {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
  ) {}

  @Post('list')
  @ApiOperation({ summary: '用户列表' })
  @ApiResult(UserEntity, true, true)
  @Permission({ group: '用户管理', name: '用户列表', model: 'User', code: 'user:list' })
  async getUsers(@Body() query: UserQueryDto) {
    const ability = defineAbilityFor(this.cls.get('user'))
    const { rows, total } = await this.nestPrisma.client.user.findAndCount({
      where: {
        AND: [
          {
            username: query.keywords ? { contains: query.keywords } : undefined,
            disabled: query.disabled,
            roles: query.roleId ? { some: { id: query.roleId } } : undefined,
          },
          accessibleBy(ability).User,
        ],
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { id: true, name: true, desc: true, disabled: true } },
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })
    return ResultData.list(rows, total)
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResult(UserEntity)
  @Permission({ group: '用户管理', name: '创建用户', model: 'User', code: 'user:create' })
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, 10),
        disabled: dto.disabled ?? false,
        roles: dto.roleIds !== undefined ? { connect: dto.roleIds.map((id) => ({ id })) } : undefined,
        createdById: this.cls.get('user').id,
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { id: true, name: true, desc: true, disabled: true } },
      },
    })
    return ResultData.ok(user)
  }

  @Get(':id')
  @ApiOperation({ summary: '用户详情' })
  @ApiResult(UserEntity)
  @Permission({ group: '用户管理', name: '用户详情', model: 'User', code: 'user:info' })
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { id: true, name: true, desc: true, disabled: true } },
      },
    })
    return ResultData.ok(user)
  }

  @Post('update')
  @ApiOperation({ summary: '更新用户' })
  @ApiResult(UserEntity)
  @Permission({ group: '用户管理', name: '更新用户', model: 'User', code: 'user:update' })
  async updateUser(@Body() dto: UpdateUserBodyDto) {
    const ability = defineAbilityFor(this.cls.get('user'))
    const record = await this.prisma.user.findFirst({ where: { id: dto.id, AND: [accessibleBy(ability).User] } })
    if (!record) throw new NotFoundException('用户不存在或无权限操作')
    const user = await this.prisma.user.update({
      where: { id: dto.id },
      data: {
        username: dto.username,
        disabled: dto.disabled,
        ...(dto.password ? { password: await bcrypt.hash(dto.password, 10) } : {}),
        ...(dto.roleIds !== undefined ? { roles: { set: dto.roleIds.map((roleId) => ({ id: roleId })) } } : {}),
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { id: true, name: true, desc: true, disabled: true } },
      },
    })
    return ResultData.ok(user)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResult(UserEntity)
  @Permission({ group: '用户管理', name: '删除用户', model: 'User', code: 'user:delete' })
  async deleteUser(@Param('id') id: string) {
    // 权限检查
    const ability = defineAbilityFor(this.cls.get('user'))
    const record = await this.prisma.user.findFirst({ where: { id, AND: [accessibleBy(ability).User] } })
    if (!record) throw new NotFoundException('用户不存在或无权限操作')
    if (!ability.can(Actions.Delete, 'User', record.id)) throw new ForbiddenException('无权限删除用户')
    // 删除用户
    const user = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { id: true, name: true, desc: true, disabled: true } },
      },
    })
    return ResultData.ok(user)
  }
}
