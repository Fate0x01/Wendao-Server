import { accessibleBy } from '@casl/prisma'
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { BaseRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import _ from 'lodash'
import { ClsService } from 'nestjs-cls'
import { PrismaService } from 'nestjs-prisma'
import { Permission } from 'src/common/decorators/permission.decorator'
import { ApiResult, ResultData } from 'src/common/decorators/response.decorator'
import defineAbilityFor from 'src/shared/casl/casl-ability.factory'
import { NestPrisma, NestPrismaServiceType } from 'src/shared/prisma/prisma.extension.decorator'
import { ReqUser } from '../sys_auth/types/request'
import { AddMemberDto } from './dto/add-member.dto'
import { CreateDeptDto } from './dto/create-dept.dto'
import { DeptQueryDto } from './dto/dept-query.dto'
import { LinkMemberDto } from './dto/link-member.dto'
import { MembersQueryDto } from './dto/members-query.dto'
import { RemoveMemberDto } from './dto/remove-member.dto'
import { SetLeadersDto } from './dto/set-leaders.dto'
import { UpdateDeptDto } from './dto/update-dept.dto'
import { DeptMemberEntity } from './entities/dept-member.entity'
import { DeptDetailEntity, DeptEntity, DeptTreeEntity } from './entities/dept.entity'

@ApiTags('部门管理')
@Controller('sys-dept')
export class SysDeptController {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
    @NestPrisma() private readonly nestPrisma: NestPrismaServiceType,
  ) {}

  /**
   * 检查用户是否为超级管理员
   */
  private isSuperAdmin(user: ReqUser): boolean {
    return user.roles.some((r) => r.name === BaseRole.SUPER_ADMIN)
  }

  /**
   * 检查用户是否为普通管理员
   */
  private isNormalAdmin(user: ReqUser): boolean {
    return user.roles.some((r) => r.name === BaseRole.NORMAL_ADMIN)
  }

  /**
   * 获取用户负责的部门ID列表
   */
  private async getLeadingDeptIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { leadingDepartments: { select: { id: true } } },
    })
    return user?.leadingDepartments.map((d) => d.id) ?? []
  }

  /**
   * 获取用户负责的一级部门ID列表
   */
  private async getLeadingLevel1DeptIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        leadingDepartments: {
          where: { parentId: null },
          select: { id: true },
        },
      },
    })
    return user?.leadingDepartments.map((d) => d.id) ?? []
  }

  /**
   * 根据用户在所有部门的身份，计算其应该拥有的最高角色
   * 规则：
   * - 一级部门负责人 → NORMAL_ADMIN
   * - 二级部门负责人 → DEPARTMENT_LEADER
   * - 二级部门成员 → DEPARTMENT_MEMBER
   * - 无任何部门关联 → null (不分配部门相关角色)
   */
  private async calculateUserDeptRole(userId: string): Promise<BaseRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        leadingDepartments: {
          select: { id: true, parentId: true },
        },
        departments: {
          select: { id: true, parentId: true },
        },
      },
    })
    if (!user) return null

    // 检查是否是一级部门负责人
    const isLevel1Leader = user.leadingDepartments.some((d) => d.parentId === null)
    if (isLevel1Leader) return BaseRole.NORMAL_ADMIN

    // 检查是否是二级部门负责人
    const isLevel2Leader = user.leadingDepartments.some((d) => d.parentId !== null)
    if (isLevel2Leader) return BaseRole.DEPARTMENT_LEADER

    // 检查是否是二级部门成员
    const isLevel2Member = user.departments.some((d) => d.parentId !== null)
    if (isLevel2Member) return BaseRole.DEPARTMENT_MEMBER

    return null
  }

  /**
   * 同步更新用户的部门相关角色
   * 根据用户当前在所有部门中的身份，设置正确的角色
   */
  private async syncUserDeptRole(userId: string): Promise<void> {
    const targetRole = await this.calculateUserDeptRole(userId)
    const deptRoleNames = [BaseRole.NORMAL_ADMIN, BaseRole.DEPARTMENT_LEADER, BaseRole.DEPARTMENT_MEMBER] as string[]

    // 获取所有部门相关角色
    const roles = await this.prisma.role.findMany({
      where: { name: { in: deptRoleNames } },
      select: { id: true, name: true },
    })
    const roleMap = new Map(roles.map((r) => [r.name, r.id]))

    // 获取用户当前角色
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: { select: { id: true, name: true } } },
    })
    if (!user) return

    const currentDeptRoleNames = user.roles.filter((r) => deptRoleNames.includes(r.name)).map((r) => r.name)

    // 如果目标角色与当前角色一致，无需更新
    if (targetRole && currentDeptRoleNames.length === 1 && currentDeptRoleNames[0] === targetRole) {
      return
    }

    // 移除所有部门相关角色
    const rolesToDisconnect = roles.filter((r) => currentDeptRoleNames.includes(r.name)).map((r) => ({ id: r.id }))

    // 添加目标角色
    const targetRoleId = targetRole ? roleMap.get(targetRole) : null

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: rolesToDisconnect,
          ...(targetRoleId ? { connect: { id: targetRoleId } } : {}),
        },
      },
    })
  }

  @Post('create')
  @ApiOperation({ summary: '创建部门' })
  @ApiResult(DeptEntity)
  @Permission({ group: '部门管理', name: '创建部门', model: 'Department', code: 'dept:create' })
  async createDept(@Body() dto: CreateDeptDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const isAdmin = this.isSuperAdmin(currentUser)

    // 层级限制校验
    if (dto.parentId) {
      // 创建二级部门
      const parentDept = await this.prisma.department.findUnique({
        where: { id: dto.parentId },
        select: { id: true, parentId: true },
      })
      if (!parentDept) throw new NotFoundException('父部门不存在')
      if (parentDept.parentId) throw new BadRequestException('不允许创建三级及以上部门')

      // 非超管需要是父部门负责人
      if (!isAdmin) {
        const leadingDeptIds = await this.getLeadingDeptIds(currentUser.id)
        if (!leadingDeptIds.includes(dto.parentId)) {
          throw new ForbiddenException('只有部门负责人可以创建子部门')
        }
      }
    } else {
      // 创建一级部门，仅超管可操作
      if (!isAdmin) throw new ForbiddenException('只有超级管理员可以创建一级部门')
    }

    const dept = await this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description,
        disabled: dto.disabled ?? false,
        parentId: dto.parentId,
        createdById: currentUser.id,
      },
    })
    return ResultData.ok(dept)
  }

  @Post('update')
  @ApiOperation({ summary: '更新部门' })
  @ApiResult(DeptEntity)
  @Permission({ group: '部门管理', name: '更新部门', model: 'Department', code: 'dept:update' })
  async updateDept(@Body() dto: UpdateDeptDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    // 权限校验
    const record = await this.prisma.department.findFirst({
      where: { id: dto.id, AND: [accessibleBy(ability).Department] },
    })
    if (!record) throw new NotFoundException('部门不存在或无权限操作')

    const dept = await this.prisma.department.update({
      where: { id: dto.id },
      data: {
        name: dto.name,
        description: dto.description,
        disabled: dto.disabled,
      },
    })
    return ResultData.ok(dept)
  }

  @Post('list')
  @ApiOperation({ summary: '部门列表' })
  @ApiResult(DeptEntity, true, true)
  @Permission({ group: '部门管理', name: '部门列表', model: 'Department', code: 'dept:list' })
  async getDeptList(@Body() query: DeptQueryDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    const { rows, total } = await this.nestPrisma.client.department.findAndCount({
      where: {
        AND: [
          {
            name: query.keywords ? { contains: query.keywords } : undefined,
            disabled: query.disabled,
            parentId: query.parentId,
          },
          accessibleBy(ability).Department,
        ],
      },
      include: {
        parent: { select: { id: true, name: true } },
        leaders: { select: { id: true, username: true } },
        _count: { select: { members: true, children: true } },
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })
    return ResultData.list(rows, total)
  }

  @Get('tree')
  @ApiOperation({ summary: '部门树' })
  @ApiResult(DeptTreeEntity, true, false)
  @Permission({ group: '部门管理', name: '部门树', model: 'Department', code: 'dept:tree' })
  async getDeptTree() {
    const currentUser: ReqUser = this.cls.get('user')
    const isSuperAdmin = this.isSuperAdmin(currentUser)

    // 超管：返回所有一级部门及其子部门
    if (isSuperAdmin) {
      const depts = await this.prisma.department.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              leaders: { select: { id: true, username: true } },
              _count: { select: { members: true } },
            },
          },
          leaders: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return ResultData.ok(depts)
    }

    // 获取用户负责的部门和所属部门
    const leadingDeptIds = currentUser.leadingDepartments?.map((d) => d.id) ?? []
    const memberDeptIds = currentUser.departments?.map((d) => d.id) ?? []

    if (leadingDeptIds.length === 0 && memberDeptIds.length === 0) {
      return ResultData.ok([])
    }

    // 查询用户负责的一级部门
    const leadingLevel1Depts = await this.prisma.department.findMany({
      where: {
        id: { in: leadingDeptIds },
        parentId: null,
      },
      select: { id: true },
    })
    const leadingLevel1DeptIds = leadingLevel1Depts.map((d) => d.id)

    // 查询用户负责或所属的二级部门
    const allUserDeptIds = [...new Set([...leadingDeptIds, ...memberDeptIds])]
    const userLevel2Depts = await this.prisma.department.findMany({
      where: {
        id: { in: allUserDeptIds },
        parentId: { not: null },
      },
      select: { id: true, parentId: true },
    })

    // 普管（一级部门负责人）：返回其负责的一级部门及其所有子部门
    if (leadingLevel1DeptIds.length > 0) {
      const depts = await this.prisma.department.findMany({
        where: { id: { in: leadingLevel1DeptIds } },
        include: {
          children: {
            include: {
              leaders: { select: { id: true, username: true } },
              _count: { select: { members: true } },
            },
          },
          leaders: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return ResultData.ok(depts)
    }

    // 二级部门负责人或成员：仅返回其关联的二级部门
    // 需要包含父部门信息供前端展示树结构
    const accessibleLevel2DeptIds = userLevel2Depts.map((d) => d.id)
    const parentIds = _.uniq(userLevel2Depts.map((d) => d.parentId).filter(Boolean)) as string[]

    // 查询父部门作为树的根节点，但只展示用户有权限的子部门
    const depts = await this.prisma.department.findMany({
      where: { id: { in: parentIds } },
      include: {
        children: {
          where: { id: { in: accessibleLevel2DeptIds } },
          include: {
            leaders: { select: { id: true, username: true } },
            _count: { select: { members: true } },
          },
        },
        leaders: { select: { id: true, username: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return ResultData.ok(depts)
  }

  @Get(':id')
  @ApiOperation({ summary: '部门详情' })
  @ApiResult(DeptDetailEntity)
  @Permission({ group: '部门管理', name: '部门详情', model: 'Department', code: 'dept:info' })
  async getDept(@Param('id') id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        leaders: { select: { id: true, username: true } },
      },
    })
    if (!dept) throw new NotFoundException('部门不存在')
    return ResultData.ok(dept)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @ApiResult(DeptEntity)
  @Permission({ group: '部门管理', name: '删除部门', model: 'Department', code: 'dept:delete' })
  async deleteDept(@Param('id') id: string) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    // 权限校验
    const record = await this.prisma.department.findFirst({
      where: { id, AND: [accessibleBy(ability).Department] },
      include: {
        children: { select: { id: true } },
        members: { select: { id: true } },
      },
    })
    if (!record) throw new NotFoundException('部门不存在或无权限操作')

    // 检查是否有子部门
    if (record.children.length > 0) {
      throw new BadRequestException('该部门下存在子部门，无法删除')
    }
    // 检查是否有成员
    if (record.members.length > 0) {
      throw new BadRequestException('该部门下存在成员，无法删除')
    }

    const dept = await this.prisma.department.delete({ where: { id } })
    return ResultData.ok(dept)
  }

  // ===================== 成员管理接口 =====================

  @Post('members')
  @ApiOperation({ summary: '部门成员列表' })
  @ApiResult(DeptMemberEntity, true, true)
  @Permission({ group: '部门管理', name: '部门成员列表', model: 'Department', code: 'dept:members' })
  async getDeptMembers(@Body() query: MembersQueryDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    // 校验部门权限
    const dept = await this.prisma.department.findFirst({
      where: { id: query.departmentId, AND: [accessibleBy(ability).Department] },
      select: { id: true, leaders: { select: { id: true } } },
    })
    if (!dept) throw new NotFoundException('部门不存在或无权限操作')

    const leaderIds = dept.leaders.map((l) => l.id)

    // 查询成员
    const { rows, total } = await this.nestPrisma.client.user.findAndCount({
      where: {
        departments: { some: { id: query.departmentId } },
        username: query.keywords ? { contains: query.keywords } : undefined,
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (query.current - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
    })

    // 标记负责人
    const membersWithLeaderFlag = rows.map((m) => ({
      ...m,
      isLeader: leaderIds.includes(m.id),
    }))

    return ResultData.list(membersWithLeaderFlag, total)
  }

  @Post('add-member')
  @ApiOperation({ summary: '添加部门成员' })
  @ApiResult(DeptMemberEntity)
  @Permission({ group: '部门管理', name: '添加部门成员', model: 'Department', code: 'dept:addMember' })
  async addMember(@Body() dto: AddMemberDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const isSuperAdmin = this.isSuperAdmin(currentUser)

    // 查询目标部门
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, parentId: true },
    })
    if (!dept) throw new NotFoundException('部门不存在')

    // 确定部门层级
    const isLevel1Dept = !dept.parentId
    const isLevel2Dept = !!dept.parentId

    // 权限校验和负责人身份判定
    let assignAsLeader = dto.isLeader ?? false

    if (isSuperAdmin) {
      // 超管可以操作任何部门
      // 一级部门添加的用户默认为负责人
      if (isLevel1Dept) {
        assignAsLeader = true
      }
    } else {
      // 非超管校验
      if (isLevel1Dept) {
        throw new ForbiddenException('只有超级管理员可以在一级部门添加成员')
      }

      const leadingDeptIds = await this.getLeadingDeptIds(currentUser.id)
      const leadingLevel1DeptIds = await this.getLeadingLevel1DeptIds(currentUser.id)
      const isParentLeader = leadingLevel1DeptIds.includes(dept.parentId!)
      const isDeptLeader = leadingDeptIds.includes(dto.departmentId)

      if (!isParentLeader && !isDeptLeader) {
        throw new ForbiddenException('无权限在该部门添加成员')
      }

      // 一级部门负责人（NORMAL_ADMIN）添加的用户为二级部门负责人
      if (isParentLeader) {
        assignAsLeader = true
      }
      // 二级部门负责人添加的用户为普通成员
      // assignAsLeader 保持 false
    }

    // 创建用户并关联部门（不直接分配角色，由 syncUserDeptRole 统一处理）
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, 10),
        createdById: currentUser.id,
        departments: { connect: { id: dto.departmentId } },
        ...(assignAsLeader ? { leadingDepartments: { connect: { id: dto.departmentId } } } : {}),
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 同步用户角色
    await this.syncUserDeptRole(user.id)

    return ResultData.ok({
      ...user,
      isLeader: assignAsLeader,
    })
  }

  @Post('link-member')
  @ApiOperation({ summary: '关联已有用户到部门' })
  @ApiResult(DeptMemberEntity, true)
  @Permission({ group: '部门管理', name: '关联已有用户', model: 'Department', code: 'dept:linkMember' })
  async linkMember(@Body() dto: LinkMemberDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const isSuperAdmin = this.isSuperAdmin(currentUser)

    // 查询目标部门
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, parentId: true, members: { select: { id: true } } },
    })
    if (!dept) throw new NotFoundException('部门不存在')

    // 确定部门层级
    const isLevel1Dept = !dept.parentId
    const isLevel2Dept = !!dept.parentId

    // 权限校验
    let assignAsLeader = dto.isLeader ?? false

    if (isSuperAdmin) {
      // 超管可以操作任何部门
      // 一级部门添加的用户默认为负责人
      if (isLevel1Dept) {
        assignAsLeader = true
      }
    } else {
      // 非超管校验
      if (isLevel1Dept) {
        throw new ForbiddenException('只有超级管理员可以在一级部门添加成员')
      }

      const leadingDeptIds = await this.getLeadingDeptIds(currentUser.id)
      const leadingLevel1DeptIds = await this.getLeadingLevel1DeptIds(currentUser.id)
      const isParentLeader = leadingLevel1DeptIds.includes(dept.parentId!)
      const isDeptLeader = leadingDeptIds.includes(dto.departmentId)

      if (!isParentLeader && !isDeptLeader) {
        throw new ForbiddenException('无权限在该部门添加成员')
      }

      // 一级部门负责人（NORMAL_ADMIN）添加的用户为二级部门负责人
      if (isParentLeader) {
        assignAsLeader = true
      }
      // 二级部门负责人添加的用户为普通成员
      // assignAsLeader 保持 false
    }

    // 校验用户是否存在
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
      select: { id: true },
    })
    const existingUserIds = existingUsers.map((u) => u.id)
    const invalidUserIds = dto.userIds.filter((id) => !existingUserIds.includes(id))
    if (invalidUserIds.length > 0) {
      throw new NotFoundException(`用户不存在: ${invalidUserIds.join(', ')}`)
    }

    // 过滤已在部门中的用户
    const existingMemberIds = dept.members.map((m) => m.id)
    const newUserIds = dto.userIds.filter((id) => !existingMemberIds.includes(id))

    if (newUserIds.length === 0) {
      throw new BadRequestException('所选用户已全部在该部门中')
    }

    // 批量关联用户到部门
    const linkedUsers = await Promise.all(
      newUserIds.map(async (userId) => {
        const user = await this.prisma.user.update({
          where: { id: userId },
          data: {
            departments: { connect: { id: dto.departmentId } },
            ...(assignAsLeader ? { leadingDepartments: { connect: { id: dto.departmentId } } } : {}),
          },
          select: {
            id: true,
            username: true,
            disabled: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        // 同步用户角色
        await this.syncUserDeptRole(userId)

        return { ...user, isLeader: assignAsLeader }
      }),
    )

    return ResultData.ok(linkedUsers)
  }

  @Post('remove-member')
  @ApiOperation({ summary: '移除部门成员' })
  @ApiResult(DeptMemberEntity)
  @Permission({ group: '部门管理', name: '移除部门成员', model: 'Department', code: 'dept:removeMember' })
  async removeMember(@Body() dto: RemoveMemberDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    // 校验部门权限
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, AND: [accessibleBy(ability).Department] },
    })
    if (!dept) throw new NotFoundException('部门不存在或无权限操作')

    // 校验用户是否属于该部门
    const user = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        departments: { some: { id: dto.departmentId } },
      },
      select: { id: true, username: true, disabled: true, createdAt: true, updatedAt: true },
    })
    if (!user) throw new NotFoundException('用户不存在或不属于该部门')

    // 从部门移除成员（同时移除负责人身份）
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: {
        departments: { disconnect: { id: dto.departmentId } },
        leadingDepartments: { disconnect: { id: dto.departmentId } },
      },
    })

    // 同步用户角色
    await this.syncUserDeptRole(dto.userId)

    return ResultData.ok({ ...user, isLeader: false })
  }

  @Post('set-leaders')
  @ApiOperation({ summary: '设置部门负责人' })
  @ApiResult(DeptEntity)
  @Permission({ group: '部门管理', name: '设置部门负责人', model: 'Department', code: 'dept:setLeaders' })
  async setLeaders(@Body() dto: SetLeadersDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const ability = defineAbilityFor(currentUser)

    // 校验部门权限
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, AND: [accessibleBy(ability).Department] },
      include: {
        members: { select: { id: true } },
        leaders: { select: { id: true } },
      },
    })
    if (!dept) throw new NotFoundException('部门不存在或无权限操作')

    // 校验负责人必须是部门成员
    const memberIds = dept.members.map((m) => m.id)
    const invalidIds = dto.leaderIds.filter((id) => !memberIds.includes(id))
    if (invalidIds.length > 0) {
      throw new BadRequestException('负责人必须是该部门的成员')
    }

    // 计算被移除的负责人和新增的负责人
    const oldLeaderIds = dept.leaders.map((l) => l.id)
    const newLeaderIds = dto.leaderIds
    const removedLeaderIds = _.difference(oldLeaderIds, newLeaderIds)
    const addedLeaderIds = _.difference(newLeaderIds, oldLeaderIds)

    // 更新部门负责人
    const updatedDept = await this.prisma.department.update({
      where: { id: dto.departmentId },
      data: {
        leaders: { set: dto.leaderIds.map((id) => ({ id })) },
      },
      include: {
        leaders: { select: { id: true, username: true } },
      },
    })

    // 同步所有受影响用户的角色
    const affectedUserIds = [...removedLeaderIds, ...addedLeaderIds]
    for (const userId of affectedUserIds) {
      await this.syncUserDeptRole(userId)
    }

    return ResultData.ok(updatedDept)
  }
}
