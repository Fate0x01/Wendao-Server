import { selectGlobal } from 'modules/global';
import { useAppSelector } from 'modules/store';
import { memo, useMemo, useState } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import router, { IRouter } from 'router';
import { Menu, MenuValue } from 'tdesign-react';
import { resolve } from 'utils/path';
import { canAccessByMeta } from 'utils/permission';
import { useAuthStore } from 'stores/auth';
import Style from './Menu.module.less';
import MenuLogo from './MenuLogo';

const { SubMenu, MenuItem, HeadMenu } = Menu;

interface IMenuProps {
  showLogo?: boolean;
  showOperation?: boolean;
}

const renderMenuItems = (
  menu: IRouter[],
  accessContext: { roles: string[]; permissions: string[] },
  navigate: NavigateFunction,
  parentPath = '',
) => {
  return menu.map((item) => {
    const { children, meta, path } = item;

    if (!meta || meta?.hidden === true) {
      // 无meta信息 或 hidden == true，路由不显示为菜单
      return null;
    }

    const { Icon, title, single } = meta;
    const allowCurrent = canAccessByMeta(meta, accessContext);
    const routerPath = resolve(parentPath, path);

    if (!children || children.length === 0) {
      if (!allowCurrent) return null;
      return (
        <MenuItem
          key={routerPath}
          value={routerPath}
          icon={Icon ? <Icon /> : undefined}
          onClick={() => navigate(routerPath)}
        >
          {title}
        </MenuItem>
      );
    }

    if (single && children?.length > 0) {
      const firstVisibleChild = children.find(
        (child) => child.meta && !child.meta.hidden && canAccessByMeta(child.meta, accessContext),
      );
      if (allowCurrent && firstVisibleChild?.meta) {
        const { Icon, title } = meta;
        const singlePath = resolve(resolve(parentPath, path), firstVisibleChild.path);
        return (
          <MenuItem
            key={singlePath}
            value={singlePath}
            icon={Icon ? <Icon /> : undefined}
            onClick={() => navigate(singlePath)}
          >
            {title}
          </MenuItem>
        );
      }
    }

    const renderedChildren = renderMenuItems(children, accessContext, navigate, routerPath).filter(Boolean);
    if (!allowCurrent || renderedChildren.length === 0) return null;

    return (
      <SubMenu key={routerPath} value={routerPath} title={title} icon={Icon ? <Icon /> : undefined}>
        {renderedChildren}
      </SubMenu>
    );
  });
};

/**
 * 顶部菜单
 */
export const HeaderMenu = memo(() => {
  const globalState = useAppSelector(selectGlobal);
  const location = useLocation();
  const [active, setActive] = useState<MenuValue>(location.pathname); // todo
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const accessContext = useMemo(() => ({ roles, permissions }), [roles, permissions]);
  const navigate = useNavigate();

  return (
    <HeadMenu
      expandType='popup'
      style={{ marginBottom: 20 }}
      value={active}
      theme={globalState.theme}
      onChange={(v) => setActive(v)}
    >
      {renderMenuItems(router, accessContext, navigate)}
    </HeadMenu>
  );
});

/**
 * 左侧菜单
 */
export default memo((props: IMenuProps) => {
  const location = useLocation();
  const globalState = useAppSelector(selectGlobal);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const accessContext = useMemo(() => ({ roles, permissions }), [roles, permissions]);
  const navigate = useNavigate();

  const { version } = globalState;
  const bottomText = globalState.collapsed ? version : `TDesign Starter ${version}`;

  return (
    <Menu
      width='232px'
      style={{ flexShrink: 0, height: '100%' }}
      className={Style.menuPanel2}
      value={location.pathname}
      theme={globalState.theme}
      collapsed={globalState.collapsed}
      operations={props.showOperation ? <div className={Style.menuTip}>{bottomText}</div> : undefined}
      logo={props.showLogo ? <MenuLogo collapsed={globalState.collapsed} /> : undefined}
    >
      {renderMenuItems(router, accessContext, navigate)}
    </Menu>
  );
});
