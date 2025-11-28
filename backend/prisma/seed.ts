import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建系统角色
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      desc: '超级管理员',
      isSystem: true,
      disabled: false,
    },
  })
  const normalUserRole = await prisma.role.upsert({
    where: { name: 'NORMAL_ADMIN' },
    update: {},
    create: {
      name: 'NORMAL_ADMIN',
      desc: '普通管理员',
      isSystem: true,
      disabled: false,
    },
  })
  const departmentLeaderRole = await prisma.role.upsert({
    where: { name: 'DEPARTMENT_LEADER' },
    update: {},
    create: {
      name: 'DEPARTMENT_LEADER',
      desc: '部门负责人',
      isSystem: true,
      disabled: false,
    },
  })
  const departmentMemberRole = await prisma.role.upsert({
    where: { name: 'DEPARTMENT_MEMBER' },
    update: {},
    create: {
      name: 'DEPARTMENT_MEMBER',
      desc: '子部门成员',
      isSystem: true,
      disabled: false,
    },
  })

  // 创建超管账号
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      disabled: false,
      roles: {
        connect: { id: superAdminRole.id },
      },
    },
  })

  console.log('✅ 测试数据填充完成')
  console.log('📝 系统角色:')
  console.log(`   - ${superAdminRole.name} (${superAdminRole.desc})`)
  console.log(`   - ${normalUserRole.name} (${normalUserRole.desc})`)
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
