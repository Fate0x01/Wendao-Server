import { lazy } from 'react';
import { DashboardIcon, SettingIcon, StoreIcon, UsergroupIcon } from 'tdesign-icons-react';
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
  {
    path: '/department',
    meta: {
      title: '部门管理',
      Icon: UsergroupIcon,
      allowRole: [BaseRole.SUPER_ADMIN, BaseRole.NORMAL_ADMIN, BaseRole.DEPARTMENT_LEADER],
    },
    children: [
      {
        path: 'list',
        Component: lazy(() => import('pages/Department/DepartmentManager')),
        meta: {
          title: '部门列表',
        },
      },
      {
        path: 'members',
        Component: lazy(() => import('pages/Department/MemberManager')),
        meta: {
          title: '成员管理',
        },
      },
    ],
  },
  {
    path: '/business',
    meta: {
      title: '业务管理',
      Icon: StoreIcon,
      allowRole: ['SUPER_ADMIN'],
      allowPermission: ['goods:list'],
    },
    children: [
      {
        path: 'goods',
        Component: lazy(() => import('pages/Business/GoodsManager')),
        meta: {
          title: '商品管理',
        },
      },
    ],
  },
];

const allRoutes = [...routes, ...otherRoutes];
export default allRoutes;
export type { IRouteMeta, default as IRouter, RouteMeta } from './interface/route';
