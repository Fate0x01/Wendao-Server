import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { ViewModuleIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/list',
    meta: {
      title: '列表页',
      Icon: ViewModuleIcon,
    },
    children: [
      {
        path: 'base',
        Component: lazy(() => import('pages/_Example/List/Base')),
        meta: {
          title: '基础列表页',
        },
      },
      {
        path: 'card',
        Component: lazy(() => import('pages/_Example/List/Card')),
        meta: {
          title: '卡片列表页',
        },
      },
      {
        path: 'select',
        Component: lazy(() => import('pages/_Example/List/Select')),
        meta: { title: '筛选列表页' },
      },
      {
        path: 'tree',
        Component: lazy(() => import('pages/_Example/List/Tree')),
        meta: { title: '树状筛选列表页' },
      },
    ],
  },
];

export default result;
