import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { LayersIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/detail',
    meta: {
      title: '详情页',
      Icon: LayersIcon,
    },
    children: [
      {
        path: 'base',
        Component: lazy(() => import('pages/_Example/Detail/Base')),
        meta: {
          title: '基础详情页',
        },
      },
      {
        path: 'advanced',
        Component: lazy(() => import('pages/_Example/Detail/Advanced')),
        meta: { title: '多卡片详情页' },
      },
      {
        path: 'deploy',
        Component: lazy(() => import('pages/_Example/Detail/Deploy')),
        meta: { title: '数据详情页' },
      },
      {
        path: 'secondary',
        Component: lazy(() => import('pages/_Example/Detail/Secondary')),
        meta: { title: '二级详情页' },
      },
    ],
  },
];

export default result;
