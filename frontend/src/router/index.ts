import { lazy } from 'react';
import { DashboardIcon, SettingIcon } from 'tdesign-icons-react';
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

const allRoutes = [...routes, ...otherRoutes];
export default allRoutes;
export type { IRouteMeta, default as IRouter, RouteMeta } from './interface/route';
