/**
 * 权限扫描器
 * 在控制器中使用 @Permission 装饰器
 * 应用启动后会自动扫描并保存权限
 */

import { Injectable } from '@nestjs/common'
import { DiscoveryService, Reflector } from '@nestjs/core'
import { PrismaService } from 'nestjs-prisma'
import { PERMISSION_KEY, PermissionValue } from 'src/common/decorators/permission.decorator'

@Injectable()
export class PermissionScanner {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async scanAndSave() {
    const permissions = new Set<PermissionValue>()
    // 获取所有控制器
    const controllers = this.discoveryService.getControllers()
    // 扫描所有控制器的方法
    for (const controller of controllers) {
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller.instance)).filter((item) => item !== 'constructor')
      for (const methodName of methodNames) {
        const handler = controller.instance[methodName]
        // 获取 Permission 装饰器的元数据
        const metadata = this.reflector.get<PermissionValue[]>(PERMISSION_KEY, handler)
        if (metadata) {
          metadata.forEach((permission) => permissions.add(permission))
        }
      }
    }
    // 保存新的权限
    for (const permission of permissions) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          group: permission.group,
          name: permission.name,
          model: permission.model,
        },
        create: {
          group: permission.group,
          name: permission.name,
          code: permission.code,
          model: permission.model,
        },
      })
    }
    // 清理无效权限
    const scannedCodes = new Set(Array.from(permissions).map((p) => p.code))
    const dbPermissions = await this.prisma.permission.findMany({ select: { code: true } })
    const codesToDelete = dbPermissions.filter((p) => !scannedCodes.has(p.code)).map((p) => p.code)
    if (codesToDelete.length > 0) {
      await this.prisma.permission.deleteMany({ where: { code: { in: codesToDelete } } })
    }
  }
}
