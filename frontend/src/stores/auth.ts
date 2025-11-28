import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LoginEntity, UserProfile } from 'services/generated/model';

// 重新导出类型供外部使用
export type { LoginEntity as LoginTokens, UserProfile };

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  userProfile: UserProfile | null;
  roles: string[];
  permissions: string[];
  actions: {
    setTokens: (tokens: LoginEntity) => void;
    setUserProfile: (profile: UserProfile) => void;
    setAccessControl: (payload: { roles?: string[]; permissions?: string[] }) => void;
    reset: () => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      userProfile: null,
      roles: [],
      permissions: [],
      actions: {
        setTokens: (tokens) =>
          set(() => {
            const now = Date.now();
            return {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              accessTokenExpiresAt: now + tokens.expires_in * 1000,
              refreshTokenExpiresAt: now + tokens.refresh_expires_in * 1000,
            };
          }),
        setUserProfile: (profile) =>
          set({
            userProfile: profile,
          }),
        setAccessControl: (payload) =>
          set({
            roles: Array.from(new Set(payload.roles || [])),
            permissions: Array.from(new Set(payload.permissions || [])),
          }),
        reset: () =>
          set({
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            userProfile: null,
            roles: [],
            permissions: [],
          }),
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => Object.fromEntries(Object.entries(state).filter(([key]) => !['actions'].includes(key))),
    },
  ),
);

export const useAuthActions = () => useAuthStore((state) => state.actions);
export const useUserInfo = () => useAuthStore((state) => state.userProfile);
export const usePermissions = () => useAuthStore((state) => state.permissions);
export const useRoles = () => useAuthStore((state) => state.roles);
export const useAuthTokens = () => {
  const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = useAuthStore.getState();
  return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
};
