import { useQuery } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import routers, { type IRouter, type RouteMeta } from 'router';
import { fetchUserPermissions, fetchUserProfile } from 'services/auth';
import { useAuthActions, useAuthStore } from 'stores/auth';
import { Loading } from 'tdesign-react';
import { resolve } from 'utils/path';

interface AuthGuardProps {
  children: ReactNode;
  publicPaths?: string[];
}

const findRouteByPath = (
  routes: IRouter[],
  pathname: string,
  parentPath = '',
  metaChain: RouteMeta[] = [],
): { route: IRouter; metaChain: RouteMeta[] } | null => {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  for (const route of routes) {
    const currentPath = resolve(parentPath, route.path);
    const currentMetaChain = route.meta ? [...metaChain, route.meta] : metaChain;
    if (currentPath === normalizedPath) return { route, metaChain: currentMetaChain };
    if (route.children?.length) {
      const match = findRouteByPath(route.children, normalizedPath, currentPath, currentMetaChain);
      if (match) return match;
    }
  }
  return null;
};

// 路由鉴权：未登录跳转登录页，已登录则拉取最新用户信息与权限
const AuthGuard = ({ children, publicPaths = [] }: AuthGuardProps) => {
  const location = useLocation();
  const actions = useAuthActions();
  const accessToken = useAuthStore((state) => state.accessToken);

  const { isPublic, shouldRedirect } = useMemo(() => {
    const matchedRoute = findRouteByPath(routers, location.pathname);
    const isRoutePublic = matchedRoute?.metaChain?.some((meta) => meta.public);
    const isPathPublic = isRoutePublic || publicPaths.some((p) => location.pathname.startsWith(p));
    return {
      isPublic: isPathPublic,
      shouldRedirect: !accessToken && !isPathPublic,
    };
  }, [location.pathname, publicPaths, accessToken]);

  // 所有 hooks 必须在条件返回之前调用
  const { isLoading, isError, data } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: fetchUserProfile,
    enabled: Boolean(accessToken) && !isPublic,
  });

  const {
    isLoading: permissionLoading,
    isError: permissionError,
    data: permissionData,
  } = useQuery({
    queryKey: ['auth', 'permissions'],
    queryFn: fetchUserPermissions,
    enabled: Boolean(accessToken) && !isPublic,
  });

  useEffect(() => {
    if (data) actions.setUserProfile(data);
  }, [actions, data]);

  useEffect(() => {
    if (permissionData) actions.setAccessControl(permissionData);
  }, [actions, permissionData]);

  // 同步检查：未登录且非公开路径，立即跳转
  if (shouldRedirect) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (!isPublic && (isError || permissionError)) {
    actions.reset();
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (!isPublic && (isLoading || permissionLoading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
