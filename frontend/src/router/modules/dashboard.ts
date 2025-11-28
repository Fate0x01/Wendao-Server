import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { DashboardIcon } from 'tdesign-icons-react';

const dashboard: IRouter[] = [
  {
    path: '/dashboard',
    meta: {
      title: '统计报表',
      Icon: DashboardIcon,
    },
    children: [
      {
        path: 'base',
        Component: lazy(() => import('pages/_Example/Dashboard/Base')),
        meta: {
          title: '概览仪表盘',
        },
      },
      {
        path: 'detail',
        Component: lazy(() => import('pages/_Example/Dashboard/Detail')),
        meta: {
          title: '统计报表',
        },
      },
    ],
  },
];

export default dashboard;
