import { lazy } from 'react';
import IRouter from 'router/interface/route';
import { CheckCircleIcon } from 'tdesign-icons-react';

const result: IRouter[] = [
  {
    path: '/result',
    meta: {
      title: '结果页',
      Icon: CheckCircleIcon,
    },
    children: [
      {
        path: 'success',
        Component: lazy(() => import('pages/_Example/Result/Success')),
        meta: {
          title: '成功页',
        },
      },
      {
        path: 'fail',
        Component: lazy(() => import('pages/_Example/Result/Fail')),
        meta: {
          title: '失败页',
        },
      },
      {
        path: 'network-error',
        Component: lazy(() => import('pages/_Example/Result/NetworkError')),
        meta: {
          title: '网络异常',
        },
      },
      {
        path: '403',
        Component: lazy(() => import('pages/_Example/Result/403')),
        meta: {
          title: '无权限',
        },
      },
      {
        path: '404',
        Component: lazy(() => import('pages/_Example/Result/404')),
        meta: {
          title: '访问页面不存在页',
        },
      },
      {
        path: '500',
        Component: lazy(() => import('pages/_Example/Result/500')),
        meta: {
          title: '服务器出错页',
        },
      },
      {
        path: 'browser-incompatible',
        Component: lazy(() => import('pages/_Example/Result/BrowserIncompatible')),
        meta: {
          title: '浏览器不兼容页',
        },
      },
      {
        path: 'maintenance',
        Component: lazy(() => import('pages/_Example/Result/Maintenance')),
        meta: {
          title: '系统维护页',
        },
      },
    ],
  },
];

export default result;
