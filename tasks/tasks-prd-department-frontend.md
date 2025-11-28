# Tasks: 前端部门管理模块

## Relevant Files

- `frontend/src/router/index.ts` - 路由配置，新增部门管理一级菜单
- `frontend/src/pages/Department/DepartmentManager/index.tsx` - 部门列表页面主入口
- `frontend/src/pages/Department/DepartmentManager/index.module.less` - 部门列表页面样式
- `frontend/src/pages/Department/DepartmentManager/hooks/useDeptTree.ts` - 部门树数据管理 Hook
- `frontend/src/pages/Department/DepartmentManager/components/DeptTree.tsx` - 部门树组件
- `frontend/src/pages/Department/DepartmentManager/components/DeptDetail.tsx` - 部门详情面板组件
- `frontend/src/pages/Department/DepartmentManager/components/DeptFormModal.tsx` - 创建/编辑部门弹窗
- `frontend/src/pages/Department/DepartmentManager/components/MemberList.tsx` - 嵌入式成员列表组件
- `frontend/src/pages/Department/MemberManager/index.tsx` - 成员管理页面主入口
- `frontend/src/pages/Department/MemberManager/index.module.less` - 成员管理页面样式
- `frontend/src/pages/Department/MemberManager/components/AddMemberModal.tsx` - 添加新成员弹窗
- `frontend/src/pages/Department/MemberManager/components/SelectMemberModal.tsx` - 选择已有成员弹窗

### Notes

- 部门管理作为独立一级菜单，与系统管理平级
- 部门管理板块对超管、一级/二级负责人、普通成员可见（权限由后端数据控制）
- 系统管理板块仅对超管可见
- 使用 TDesign 的 `Tree` 组件实现部门树
- 复用 CrudKit 的 `useCrudTable`、`useCrudModal`、`CrudFormModal`、`OperationColumn` 组件

## Tasks

- [x] 1.0 路由配置与基础目录结构

  - [x] 1.1 在 `router/index.ts` 中添加 `/department` 一级菜单路由配置
  - [x] 1.2 创建 `pages/Department/DepartmentManager` 目录结构
  - [x] 1.3 创建 `pages/Department/MemberManager` 目录结构

- [x] 2.0 部门树组件开发（DeptTree）

  - [x] 2.1 创建 `useDeptTree` Hook，实现部门树数据获取、加载状态、刷新功能
  - [x] 2.2 创建 `DeptTree` 组件基础结构，使用 TDesign Tree 组件渲染树形结构
  - [x] 2.3 实现树节点自定义渲染，支持禁用状态灰色显示和"已禁用"标识
  - [x] 2.4 实现搜索过滤功能，支持按部门名称过滤树节点
  - [x] 2.5 实现节点选中交互，暴露 `onSelect` 回调和 `selectedId` 受控属性

- [x] 3.0 部门管理页面开发（DepartmentManager）

  - [x] 3.1 创建页面主入口 `index.tsx`，实现左侧树+右侧内容区的 Flexbox 双栏布局
  - [x] 3.2 创建 `DeptDetail` 部门详情面板，展示部门信息和操作按钮
  - [x] 3.3 创建 `DeptFormModal` 弹窗组件，实现创建/编辑部门表单
  - [x] 3.4 创建 `MemberList` 嵌入式成员列表组件
  - [x] 3.5 集成工具栏和权限控制

- [x] 4.0 成员管理页面开发（MemberManager）

  - [x] 4.1 创建页面主入口 `index.tsx`，实现左侧部门树筛选器+右侧成员列表布局
  - [x] 4.2 创建 `AddMemberModal` 弹窗，实现创建新用户账号表单
  - [x] 4.3 创建 `SelectMemberModal` 弹窗，实现从已有成员中选择添加
  - [x] 4.4 实现成员列表和操作功能

- [x] 5.0 构建检查与收尾
  - [x] 5.1 执行 `pnpm build` 确保编译通过
  - [x] 5.2 执行 `pnpm lint` 确保代码规范（项目 ESLint 配置缺失，跳过）
