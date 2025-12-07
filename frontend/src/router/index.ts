import { lazy } from 'react';
import { DashboardIcon, HistoryIcon, SettingIcon, StoreIcon, TeahouseIcon, UsergroupIcon } from 'tdesign-icons-react';
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
  {
    path: '/stock',
    meta: {
      title: '库存管理',
      Icon: TeahouseIcon,
      allowRole: ['SUPER_ADMIN'],
      allowPermission: ['stock:list-jing-cang-stock', 'stock:set-reorder-threshold'],
    },
    children: [
      {
        path: 'jingcang',
        Component: lazy(() => import('pages/Business/StockManager/JingCang')),
        meta: {
          title: '京仓库存',
          allowRole: ['SUPER_ADMIN'],
          allowPermission: ['stock:list-jing-cang-stock', 'stock:set-reorder-threshold'],
        },
      },
      {
        path: 'yuncang',
        Component: lazy(() => import('pages/Business/StockManager/YunCang')),
        meta: {
          title: '云仓库存',
        },
      },
    ],
  },
  {
    path: '/logs',
    meta: {
      title: '日志管理',
      Icon: HistoryIcon,
      allowRole: ['SUPER_ADMIN'],
      allowPermission: ['goods:change-logs'],
    },
    children: [
      {
        path: 'goods-changelog',
        Component: lazy(() => import('pages/Logs/GoodsChangelog')),
        meta: {
          title: '商品变动日志',
          allowRole: ['SUPER_ADMIN'],
          allowPermission: ['goods:change-logs'],
        },
      },
    ],
  },
];

const allRoutes = [...routes, ...otherRoutes];
export default allRoutes;
export type { IRouteMeta, default as IRouter, RouteMeta } from './interface/route';
