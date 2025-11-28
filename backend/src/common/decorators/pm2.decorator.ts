/**
 * NODE_APP_INSTANCE环境变量用于区分进程，例如您可能只想在一个进程上运行 cronjob，您可以检查是否process.env.NODE_APP_INSTANCE === '0'。两个进程永远不可能有相同的编号，在pm2 restart和pm2 scale命令之后仍然如此。
 * 参考资料：https://pm2.fenxianglu.cn/docs/general/environment-variables
 */

/**
 * PM2 实例装饰器
 * @param instanceId 指定的 PM2 实例序号
 */
export function PM2Instance(instanceId: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      // 获取当前 PM2 实例 ID
      const currentInstance = process.env.NODE_APP_INSTANCE ? parseInt(process.env.NODE_APP_INSTANCE, 10) : 0
      // 如符合指定实例要求，或当前实例为 0（表示未使用 PM2 集群部署），则执行方法
      if (currentInstance === instanceId || currentInstance === 0) {
        return originalMethod.apply(this, args)
      } else {
        return
      }
    }
    return descriptor
  }
}
