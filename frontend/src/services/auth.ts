/**
 * 认证相关服务
 * 统一使用 orval 生成的 API，此文件仅提供业务封装
 */
import api from 'services';
import type { LoginDto, LoginEntity, RoleEntity, UserProfile } from './generated/model';

export interface UserAccessPayload {
  roles: string[];
  permissions: string[];
}

/**
 * 登录
 */
export const loginWithPassword = async (payload: LoginDto): Promise<LoginEntity> => {
  const res = await api.sysAuthControllerLogin(payload);
  return res.data!;
};

/**
 * 获取用户信息
 */
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const res = await api.sysAuthControllerGetUserInfo();
  return res.data!;
};

/**
 * 获取用户权限
 */
export const fetchUserPermissions = async (): Promise<UserAccessPayload> => {
  const res = await api.sysAuthControllerGetUserPermissions();
  const roleList = (res.data as RoleEntity[]) || [];
  const roleNames = roleList.map((item) => item.name || item.id).filter(Boolean) as string[];
  const permissionCodes = roleList.flatMap((role) => role.permissions?.map((item) => item.code) || []);
  return {
    roles: Array.from(new Set(roleNames)),
    permissions: Array.from(new Set(permissionCodes)),
  };
};

export type { LoginDto, LoginEntity, UserProfile };
