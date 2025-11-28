import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { UserCircleIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/user',
    meta: {
      title: '个人页',
      Icon: UserCircleIcon,
    },
    children: [
      {
        path: 'index',
        Component: lazy(() => import('pages/_Example/User')),
        meta: {
          title: '个人中心',
        },
      },
    ],
  },
];

export default result;
