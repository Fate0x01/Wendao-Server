import { lazy } from 'react';
import { DashboardIcon, SettingIcon, ViewModuleIcon } from 'tdesign-icons-react';
import { BaseRole } from 'types/enum';
import IRouter from './interface/route';
import otherRoutes from './modules/others';

const routes: IRouter[] = [
  {
    path: '/login',
    Component: lazy(() => import('pages/Login')),
    isFullPage: true,
    meta: {
      hidden: true,
      public: true,
    },
  },
  {
    path: '/',
    redirect: '/dashboard/base',
  },
  {
    path: '/dashboard',
    meta: {
      title: '仪表盘',
      Icon: DashboardIcon,
    },
    children: [
      {
        path: 'base',
        Component: lazy(() => import('pages/Dashboard/Home')),
        meta: {
          title: '概览',
        },
      },
    ],
  },
  {
    path: '/system',
    meta: {
      title: '系统管理',
      Icon: SettingIcon,
      allowRole: ['SUPER_ADMIN'],
    },
    children: [
      {
        path: 'user',
        Component: lazy(() => import('pages/System/UserManager')),
        meta: {
          title: '用户管理',
        },
      },
      {
        path: 'role',
        Component: lazy(() => import('pages/System/RoleManager')),
        meta: {
          title: '角色管理',
        },
      },
    ],
  },
];

const devRoutes: IRouter[] = [
  {
    path: '/example',
    meta: { title: '示例集合', Icon: ViewModuleIcon },
    children: [
      {
        path: '/permission',
        meta: { title: '页面权限' },
        children: [
          {
            path: '/permission/admin',
            Component: lazy(() => import('pages/Example/Permission/admin')),
            meta: { title: '管理员权限', allowRole: [BaseRole.SUPER_ADMIN] },
          },
          {
            path: '/permission/user',
            Component: lazy(() => import('pages/Example/Permission/user')),
            meta: { title: '普通用户权限', allowRole: [BaseRole.NORMAL_USER] },
          },
        ],
      },
    ],
  },
];

const isDevelopment = import.meta.env.MODE === 'development';
const allRoutes = [...routes, ...otherRoutes, ...(isDevelopment ? devRoutes : [])];
export default allRoutes;
export type { IRouteMeta, default as IRouter, RouteMeta } from './interface/route';
