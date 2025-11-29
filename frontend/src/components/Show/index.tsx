import { usePermissions, useRoles } from 'stores/auth';
import { BaseRole } from 'types/enum';

interface ShowProps {
  permission?: string;
  role?: BaseRole;
  children: React.ReactNode;
  defaultToSuperAdmin?: boolean;
}

/**
 * 权限展示组件
 * 逻辑说明：
 * 1. 如果 defaultToSuperAdmin = true，超级管理员(SUPER_ADMIN)始终可见。
 * 2. 同时传递 role 和 permission 时，用户需同时具备 role 和 permission。
 * 3. 只传 role 或 permission，用户具备其一即可。
 * 4. 未传 role/permission 时不展示。
 */
export default function Show({ permission, role, children, defaultToSuperAdmin = true }: ShowProps) {
  const permissions = usePermissions();
  const roles = useRoles();

  const isSuperAdmin = defaultToSuperAdmin && roles.includes(BaseRole.SUPER_ADMIN);
  let shouldShow = false;

  if (role && permission) {
    shouldShow = roles.includes(role) && (permissions?.includes(permission) ?? false);
  } else if (role) {
    shouldShow = roles.includes(role);
  } else if (permission) {
    shouldShow = permissions?.includes(permission) ?? false;
  }

  if (isSuperAdmin || shouldShow) {
    return <>{children}</>;
  }
  return null;
}
