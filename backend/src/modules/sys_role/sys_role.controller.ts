import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { CreateRoleDto } from './dto/create-role.dto'
import { RoleQueryDto } from './dto/role-query.dto'
import { UpdateRoleBodyDto } from './dto/update-role-body.dto'
import { PermissionEntity } from './entities/permission.entity'
import { RoleEntity } from './entities/role.entity'
import { SysRoleService } from './sys_role.service'

@ApiTags('系统角色')
@Controller('sys-role')
export class SysRoleController {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
    private readonly roleService: SysRoleService,
  ) {}

  @Post('list')
  @ApiOperation({ summary: '角色列表' })
  @ApiResult(RoleEntity, true, true)
  @Permission({ group: '角色管理', name: '角色列表', model: 'Role', code: 'role:list' })
  async getRoles(@Body() query: RoleQueryDto) {
    const { rows, total } = await this.nestPrisma.client.role.findAndCount({
      where: {
        name: query.keywords ? { contains: query.keywords } : undefined,
        disabled: query.disabled,
        permissions: query.permissionId ? { some: { id: query.permissionId } } : undefined,
      },
      include: { permissions: true },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })
    return ResultData.list(rows, total)
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResult(RoleEntity)
  @Permission({ group: '角色管理', name: '创建角色', model: 'Role', code: 'role:create' })
  async createRole(@Body() dto: CreateRoleDto) {
    const role = await this.nestPrisma.client.role.create({
      data: {
        name: dto.name,
        desc: dto.desc,
        disabled: dto.disabled ?? false,
        permissions: dto.permissionIds !== undefined ? { connect: dto.permissionIds.map((id) => ({ id })) } : undefined,
      },
      include: { permissions: true },
    })
    return ResultData.ok(role)
  }

  @Get('permissions')
  @ApiOperation({ summary: '权限列表' })
  @ApiResult(PermissionEntity, true)
  @Permission({ group: '角色管理', name: '权限列表', model: 'Permission', code: 'permission:list' })
  async getPermissions() {
    const permissions = await this.nestPrisma.client.permission.findMany({ orderBy: { createdAt: 'desc' } })
    return ResultData.ok(permissions)
  }

  @Get(':id')
  @ApiOperation({ summary: '角色详情' })
  @ApiResult(RoleEntity)
  @Permission({ group: '角色管理', name: '角色详情', model: 'Role', code: 'role:info' })
  async getRole(@Param('id') id: string) {
    const role = await this.nestPrisma.client.role.findUnique({
      where: { id },
      include: { permissions: true },
    })
    return ResultData.ok(role)
  }

  @Post('update')
  @ApiOperation({ summary: '更新角色' })
  @ApiResult(RoleEntity)
  @Permission({ group: '角色管理', name: '更新角色', model: 'Role', code: 'role:update' })
  async updateRole(@Body() dto: UpdateRoleBodyDto) {
    const role = await this.roleService.updateRole(dto)
    return ResultData.ok(role)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResult(RoleEntity)
  @Permission({ group: '角色管理', name: '删除角色', model: 'Role', code: 'role:delete' })
  async deleteRole(@Param('id') id: string) {
    const role = await this.nestPrisma.client.role.delete({
      where: { id },
      include: { permissions: true },
    })
    return ResultData.ok(role)
  }
}
