import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { QueueIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/form',
    meta: {
      title: '表单类',
      Icon: QueueIcon,
    },
    children: [
      {
        path: 'base',
        Component: lazy(() => import('pages/_Example/Form/Base')),
        meta: {
          title: '基础表单页',
        },
      },
      {
        path: 'step',
        Component: lazy(() => import('pages/_Example/Form/Step')),
        meta: { title: '分步表单页' },
      },
    ],
  },
];

export default result;
