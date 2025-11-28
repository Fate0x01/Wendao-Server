import type { RouteMeta } from 'router/interface/route';

interface AccessContext {
  roles?: string[];
  permissions?: string[];
}

const hasIntersection = (source: string[] = [], target: string[] = []) => source.some((item) => target.includes(item));

/**
 * 基于路由元信息计算是否具备访问权限
 *
 * 鉴权优先级：
 * 1. public: true → 直接放行
 * 2. denyRole 命中 → 直接拦截
 * 3. allowRole 命中 → 直接放行（跳过后续权限校验）
 * 4. allowPermission 命中 → 放行
 * 5. 配置了白名单（allowRole 或 allowPermission）但均未命中 → 拦截
 * 6. 未配置任何访问控制 → 默认放行
 */
export const canAccessByMeta = (meta?: RouteMeta, context: AccessContext = {}) => {
  if (!meta) return true;
  const { roles = [], permissions = [] } = context;
  const { public: isPublic, allowRole = [], denyRole = [], allowPermission = [] } = meta;
  // 公开路由，直接放行
  if (isPublic) return true;
  // 黑名单机制：命中拒绝列表直接拦截
  if (denyRole.length > 0 && hasIntersection(denyRole, roles)) {
    return false;
  }
  // 白名单机制：命中角色白名单，直接放行
  if (allowRole.length > 0 && hasIntersection(allowRole, roles)) {
    return true;
  }
  // 权限校验：命中权限白名单，放行
  if (allowPermission.length > 0 && hasIntersection(allowPermission, permissions)) {
    return true;
  }
  // 配置了任意白名单（角色或权限）但都未命中，拒绝访问
  if (allowRole.length > 0 || allowPermission.length > 0) {
    return false;
  }
  // 未配置任何访问控制，默认放行
  return true;
};
