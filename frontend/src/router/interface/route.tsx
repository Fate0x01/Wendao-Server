import { BrowserRouterProps } from 'react-router-dom';

export default interface IRouter {
  path: string; // 路由路径
  redirect?: string; // 重定向路由
  Component?: React.FC<BrowserRouterProps> | (() => any); // 路由组件
  isFullPage?: boolean; // 当前路由是否全屏显示
  meta?: RouteMeta; // 路由元信息，不存在时将不渲染菜单
  children?: IRouter[]; // 子路由
}

export interface RouteMeta {
  title?: string; // 路由标题
  Icon?: React.FC; // 路由图标
  hidden?: boolean; // 侧边栏隐藏该路由
  single?: boolean; // 单层路由
  public?: boolean; // 是否公开路由，公开路由无需登录即可访问
  allowRole?: string[]; // 允许直接访问的角色列表，命中后跳过后续鉴权
  denyRole?: string[]; // 拒绝访问的角色列表，命中后直接拦截
  allowPermission?: string[]; // 允许访问的权限代码列表，最后一道校验
}

export type { RouteMeta as IRouteMeta };
