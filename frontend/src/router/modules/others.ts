import { lazy } from 'react';
import IRouter from 'router/interface/route';

const otherRoutes: IRouter[] = [
  {
    path: '/403',
    Component: lazy(() => import('pages/_Example/Result/403')),
  },
  {
    path: '/500',
    Component: lazy(() => import('pages/_Example/Result/500')),
  },
  {
    path: '*',
    Component: lazy(() => import('pages/_Example/Result/404')),
  },
];

export default otherRoutes;
