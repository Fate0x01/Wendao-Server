import { accessibleBy } from '@casl/prisma'
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { BaseRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
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
   * 获取用户负责的部门ID列表
   */
  private async getLeadingDeptIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { leadingDepartments: { select: { id: true } } },
    })
    return user?.leadingDepartments.map((d) => d.id) ?? []
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
    const isAdmin = this.isSuperAdmin(currentUser)

    // 超管：返回所有一级部门及其子部门
    if (isAdmin) {
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

    // 非超管：根据负责的部门和所属部门构建树
    const leadingDeptIds = currentUser.leadingDepartments?.map((d) => d.id) ?? []
    const memberDeptIds = currentUser.departments?.map((d) => d.id) ?? []
    const allDeptIds = [...new Set([...leadingDeptIds, ...memberDeptIds])]

    if (allDeptIds.length === 0) {
      return ResultData.ok([])
    }

    // 查询用户关联的所有部门（包含父部门信息）
    const userDepts = await this.prisma.department.findMany({
      where: { id: { in: allDeptIds } },
      select: { id: true, parentId: true },
    })

    // 收集需要展示的一级部门ID
    const level1DeptIds = new Set<string>()
    // 收集用户可管理/查看的二级部门ID
    const accessibleLevel2DeptIds = new Set<string>()

    for (const dept of userDepts) {
      if (!dept.parentId) {
        // 这是一级部门
        level1DeptIds.add(dept.id)
      } else {
        // 这是二级部门，记录其父部门和自身
        level1DeptIds.add(dept.parentId)
        accessibleLevel2DeptIds.add(dept.id)
      }
    }

    // 查询一级部门及其子部门
    const depts = await this.prisma.department.findMany({
      where: { id: { in: Array.from(level1DeptIds) } },
      include: {
        children: {
          where: leadingDeptIds.some((id) => level1DeptIds.has(id))
            ? undefined // 如果是一级部门负责人，可以看到所有子部门
            : { id: { in: Array.from(accessibleLevel2DeptIds) } }, // 否则只能看到自己关联的二级部门
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
    const isAdmin = this.isSuperAdmin(currentUser)

    // 查询目标部门
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, parentId: true, leaders: { select: { id: true } } },
    })
    if (!dept) throw new NotFoundException('部门不存在')

    // 确定部门层级
    const isLevel1Dept = !dept.parentId
    const isLevel2Dept = !!dept.parentId

    // 权限校验和角色分配
    let assignRole: BaseRole

    if (isAdmin) {
      // 超管可以操作任何部门
      if (isLevel1Dept) {
        // 超管添加到一级部门，默认为负责人
        assignRole = BaseRole.DEPARTMENT_LEADER
      } else {
        // 超管添加到二级部门，根据 isLeader 决定角色
        assignRole = dto.isLeader ? BaseRole.DEPARTMENT_LEADER : BaseRole.DEPARTMENT_MEMBER
      }
    } else {
      // 非超管，检查是否是该部门或其父部门的负责人
      const leadingDeptIds = await this.getLeadingDeptIds(currentUser.id)

      if (isLevel2Dept) {
        // 添加到二级部门
        const isParentLeader = leadingDeptIds.includes(dept.parentId!)
        const isDeptLeader = leadingDeptIds.includes(dto.departmentId)

        if (isParentLeader) {
          // 一级部门负责人添加到二级部门，分配 DEPARTMENT_LEADER
          assignRole = BaseRole.DEPARTMENT_LEADER
        } else if (isDeptLeader) {
          // 二级部门负责人添加成员，分配 DEPARTMENT_MEMBER
          assignRole = BaseRole.DEPARTMENT_MEMBER
        } else {
          throw new ForbiddenException('无权限在该部门添加成员')
        }
      } else {
        throw new ForbiddenException('只有超级管理员可以在一级部门添加成员')
      }
    }

    // 查找或创建角色
    const role = await this.prisma.role.findFirst({ where: { name: assignRole } })
    if (!role) throw new BadRequestException(`系统角色 ${assignRole} 不存在`)

    // 创建用户并关联部门
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, 10),
        createdById: currentUser.id,
        roles: { connect: { id: role.id } },
        departments: { connect: { id: dto.departmentId } },
        ...(dto.isLeader || assignRole === BaseRole.DEPARTMENT_LEADER ? { leadingDepartments: { connect: { id: dto.departmentId } } } : {}),
      },
      select: {
        id: true,
        username: true,
        disabled: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return ResultData.ok({
      ...user,
      isLeader: dto.isLeader || assignRole === BaseRole.DEPARTMENT_LEADER,
    })
  }

  @Post('link-member')
  @ApiOperation({ summary: '关联已有用户到部门' })
  @ApiResult(DeptMemberEntity, true)
  @Permission({ group: '部门管理', name: '关联已有用户', model: 'Department', code: 'dept:linkMember' })
  async linkMember(@Body() dto: LinkMemberDto) {
    const currentUser: ReqUser = this.cls.get('user')
    const isAdmin = this.isSuperAdmin(currentUser)

    // 查询目标部门
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true, parentId: true, members: { select: { id: true } } },
    })
    if (!dept) throw new NotFoundException('部门不存在')

    // 确定部门层级
    const isLevel1Dept = !dept.parentId

    // 权限校验
    if (!isAdmin) {
      const leadingDeptIds = await this.getLeadingDeptIds(currentUser.id)
      if (isLevel1Dept) {
        throw new ForbiddenException('只有超级管理员可以在一级部门添加成员')
      }
      const isParentLeader = leadingDeptIds.includes(dept.parentId!)
      const isDeptLeader = leadingDeptIds.includes(dto.departmentId)
      if (!isParentLeader && !isDeptLeader) {
        throw new ForbiddenException('无权限在该部门添加成员')
      }
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
            ...(dto.isLeader ? { leadingDepartments: { connect: { id: dto.departmentId } } } : {}),
          },
          select: {
            id: true,
            username: true,
            disabled: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        return { ...user, isLeader: dto.isLeader ?? false }
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
      include: { members: { select: { id: true } } },
    })
    if (!dept) throw new NotFoundException('部门不存在或无权限操作')

    // 校验负责人必须是部门成员
    const memberIds = dept.members.map((m) => m.id)
    const invalidIds = dto.leaderIds.filter((id) => !memberIds.includes(id))
    if (invalidIds.length > 0) {
      throw new BadRequestException('负责人必须是该部门的成员')
    }

    // 查找负责人角色
    const leaderRole = await this.prisma.role.findFirst({ where: { name: BaseRole.DEPARTMENT_LEADER } })
    if (!leaderRole) throw new BadRequestException('系统角色 DEPARTMENT_LEADER 不存在')

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

    // 为新负责人分配角色
    for (const leaderId of dto.leaderIds) {
      await this.prisma.user.update({
        where: { id: leaderId },
        data: { roles: { connect: { id: leaderRole.id } } },
      })
    }

    return ResultData.ok(updatedDept)
  }
}
