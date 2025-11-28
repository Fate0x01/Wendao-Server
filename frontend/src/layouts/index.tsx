import throttle from 'lodash/throttle';
import { ELayout, selectGlobal, switchTheme, toggleMenu, toggleSetting } from 'modules/global';
import { useAppDispatch, useAppSelector } from 'modules/store';
import { memo, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import routers, { type IRouter } from 'router';
import { Drawer, Layout } from 'tdesign-react';
import { resolve } from 'utils/path';
import AppLayout from './components/AppLayout';
import Setting from './components/Setting';
import Style from './index.module.less';

// 查找当前路由配置
const findRouteByPath = (routes: IRouter[], pathname: string, parentPath = ''): IRouter | null => {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  for (const route of routes) {
    const currentPath = resolve(parentPath, route.path);
    if (currentPath === normalizedPath) return route;
    if (route.children?.length) {
      const match = findRouteByPath(route.children, normalizedPath, currentPath);
      if (match) return match;
    }
  }
  return null;
};

export default memo(() => {
  const globalState = useAppSelector(selectGlobal);
  const dispatch = useAppDispatch();
  const location = useLocation();

  // 同步判断当前路由是否为全页布局，避免依赖异步更新的 redux 状态
  const isFullPage = useMemo(() => {
    const matchedRoute = findRouteByPath(routers, location.pathname);
    return matchedRoute?.isFullPage ?? false;
  }, [location.pathname]);

  const AppContainer = AppLayout[isFullPage ? ELayout.fullPage : globalState.layout];

  useEffect(() => {
    dispatch(switchTheme(globalState.theme));
    const handleResize = throttle(() => {
      if (window.innerWidth < 900) {
        dispatch(toggleMenu(true));
      } else if (window.innerWidth > 1000) {
        dispatch(toggleMenu(false));
      }
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Layout className={Style.panel}>
      <AppContainer />
      <Drawer
        destroyOnClose
        visible={globalState.setting}
        size='458px'
        footer={false}
        header='页面配置'
        onClose={() => dispatch(toggleSetting())}
      >
        <Setting />
      </Drawer>
    </Layout>
  );
});
