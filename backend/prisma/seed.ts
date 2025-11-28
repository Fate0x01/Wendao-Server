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
    where: { name: 'NORMAL_USER' },
    update: {},
    create: {
      name: 'NORMAL_USER',
      desc: '普通用户',
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

  // 创建普通用户账号
  const userPassword = await bcrypt.hash('user123', 10)
  const normalUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: userPassword,
      disabled: false,
      roles: {
        connect: { id: normalUserRole.id },
      },
    },
  })

  console.log('✅ 测试数据填充完成')
  console.log('📝 系统角色:')
  console.log(`   - ${superAdminRole.name} (${superAdminRole.desc})`)
  console.log(`   - ${normalUserRole.name} (${normalUserRole.desc})`)
  console.log('👤 用户账号:')
  console.log(`   - ${adminUser.username} (密码: admin123)`)
  console.log(`   - ${normalUser.username} (密码: user123)`)
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
