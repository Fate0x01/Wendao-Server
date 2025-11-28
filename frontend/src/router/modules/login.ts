import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { LogoutIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/login',
    meta: {
      title: '登录页',
      public: true,
      Icon: LogoutIcon,
    },
    children: [
      {
        path: 'index',
        Component: lazy(() => import('pages/Login')),
        isFullPage: true,
        meta: {
          title: '登录中心',
          public: true,
        },
      },
    ],
  },
];

export default result;
