import React, { Suspense, memo, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout, Loading } from 'tdesign-react';
import routers, { type IRouter, type RouteMeta } from 'router';
import { resolve } from 'utils/path';
import { useAuthStore } from 'stores/auth';
import { canAccessByMeta } from 'utils/permission';
import Page from './Page';
import Style from './AppRouter.module.less';

const { Content } = Layout;

type TRenderRoutes = (
  routes: IRouter[],
  parentPath?: string,
  breadcrumbs?: string[],
  metaChain?: RouteMeta[],
) => React.ReactNode[];

const RouteGuard = ({ route, metaChain, children }: { route: IRouter; metaChain?: RouteMeta[]; children: React.ReactNode }) => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const accessContext = useMemo(() => ({ roles, permissions }), [roles, permissions]);

  const metas = metaChain?.filter(Boolean) || [];
  const canAccess = metas.every((meta) => canAccessByMeta(meta, accessContext));
  const isPublic = metas.some((meta) => meta.public);

  if (!accessToken && !isPublic) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  if (!canAccess) {
    return <Navigate to='/403' replace />;
  }

  return <>{children}</>;
};

/**
 * 渲染应用路由
 * @param routes
 * @param parentPath
 * @param breadcrumb
 */
const renderRoutes: TRenderRoutes = (routes, parentPath = '', breadcrumb = [], metaChain = []) =>
  routes.map((route, index: number) => {
    const { Component, children, redirect, meta } = route;
    const currentPath = resolve(parentPath, route.path);
    let currentBreadcrumb = breadcrumb;
    const currentMetaChain = meta ? [...metaChain, meta] : metaChain;

    if (meta?.title) {
      currentBreadcrumb = currentBreadcrumb.concat([meta?.title]);
    }

    if (redirect) {
      // 重定向
      return <Route key={index} path={currentPath} element={<Navigate to={redirect} replace />} />;
    }

    if (Component) {
      // 有路由菜单
      return (
        <Route
          key={index}
          path={currentPath}
          element={
            <RouteGuard route={route} metaChain={currentMetaChain}>
              <Page isFullPage={route.isFullPage} breadcrumbs={currentBreadcrumb}>
                <Component />
              </Page>
            </RouteGuard>
          }
        />
      );
    }
    // 无路由菜单
    return children ? renderRoutes(children, currentPath, currentBreadcrumb, currentMetaChain) : null;
  });

const AppRouter = () => (
  <Content>
    <Suspense
      fallback={
        <div className={Style.loading}>
          <Loading />
        </div>
      }
    >
      <Routes>{renderRoutes(routers)}</Routes>
    </Suspense>
  </Content>
);

export default memo(AppRouter);
