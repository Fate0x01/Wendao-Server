# 商品管理功能 - 任务列表

> 基于 PRD: `prd-goods-manager.md`

## Relevant Files

- `frontend/src/pages/Business/GoodsManager/index.tsx` - 商品管理主页面组件
- `frontend/src/pages/Business/GoodsManager/components/GoodsFormFields.tsx` - 商品编辑表单字段组件（分组展示）
- `frontend/src/pages/Business/GoodsManager/components/ExtraCostModal.tsx` - 额外成本管理弹窗组件
- `frontend/src/pages/Business/GoodsManager/components/ImportResultModal.tsx` - 导入结果展示弹窗组件
- `frontend/src/pages/Business/GoodsManager/hooks/useDeptFilter.ts` - 部门筛选权限控制 Hook
- `frontend/src/pages/Business/GoodsManager/constants.ts` - 表格列配置、搜索字段配置等常量
- `frontend/src/services/generated/index.ts` - 已生成的 API 服务（只读引用）
- `frontend/src/services/generated/model/goodsEntity.ts` - 商品实体类型定义（只读引用）
- `frontend/src/services/generated/model/extraCostEntity.ts` - 额外成本实体类型定义（只读引用）
- `frontend/src/components/CrudKit/` - CrudKit 组件库（只读引用）
- `frontend/public/template/商品信息导入模板.xlsx` - 导入模板文件（静态资源）

### Notes

- 本功能主要在 `frontend/src/pages/Business/GoodsManager/` 目录下开发
- 充分利用现有 `CrudKit` 组件库，避免重复造轮子
- API 类型已通过 orval 自动生成，直接使用 `services/generated/model` 中的类型
- 部门筛选逻辑参考 `frontend/src/pages/Department/` 目录下的实现

## Tasks

- [x] 1.0 搭建商品管理页面基础框架
  - [x] 1.1 创建 `GoodsManager` 目录结构（index.tsx、components/、hooks/、constants.ts）
  - [x] 1.2 引入必要的依赖：CrudKit 组件、TDesign 组件、API 服务、类型定义
  - [x] 1.3 实现页面基础布局骨架（搜索区 + 工具栏 + 表格区）

- [x] 2.0 实现商品列表查询与展示功能
  - [x] 2.1 使用 `useCrudTable` Hook 管理表格数据、分页、加载状态
  - [x] 2.2 在 `constants.ts` 中配置搜索字段（店铺名称、SKU关键词、货架号、入仓条码）
  - [x] 2.3 在 `constants.ts` 中配置表格列定义（所有字段），设置左右固定列和横向滚动
  - [x] 2.4 实现 SKU 字段自定义渲染：数组展开/收起功能（如展示"SKU001 等3个"，点击展开全部）
  - [x] 2.5 实现产品图片字段渲染：使用 TDesign `Image` 组件显示缩略图，集成 `ImageViewer` 支持点击放大

- [x] 3.0 实现部门筛选权限控制
  - [x] 3.1 创建 `useDeptFilter` Hook：调用部门树 API，获取当前用户可访问的部门列表
  - [x] 3.2 实现用户角色判断逻辑：区分一级部门负责人、二级部门负责人、普通成员
  - [x] 3.3 根据角色动态渲染部门筛选组件：负责人显示 TreeSelect，普通成员隐藏该字段
  - [x] 3.4 普通成员场景：自动将用户所属部门 ID 注入到查询参数的 `departmentId`

- [x] 4.0 实现商品编辑功能
  - [x] 4.1 创建 `GoodsFormFields` 组件：分三组展示表单字段（基本信息、成本信息、比例设置）
  - [x] 4.2 实现基本信息字段组：部门选择（TreeSelect）、店铺名称、SKU（TagInput）、货架号、图片URL、入仓条码、规格、合格证图URL
  - [x] 4.3 实现成本信息字段组：进货成本、最低售价、快递费用、耗材费、销售出库费、TC到仓费、人工打包费（InputNumber，min=0）
  - [x] 4.4 实现比例设置字段组：交易服务费比例、佣金比例、平台推广比例、货损比例（InputNumber，0-100，后缀显示 %）
  - [x] 4.5 使用 `useCrudModal` Hook 管理编辑弹窗的打开/关闭、表单填充、提交状态
  - [x] 4.6 集成 `CrudFormModal` 组件，调用 `sysGoodsControllerUpdateGoods` API 保存数据

- [x] 5.0 实现商品删除功能
  - [x] 5.1 在操作列配置删除按钮，使用 `OperationColumn` 的 `confirm` 属性实现二次确认
  - [x] 5.2 调用 `sysGoodsControllerDeleteGoods` API 执行删除
  - [x] 5.3 删除成功后调用 `refresh()` 刷新列表，并显示成功提示

- [x] 6.0 实现额外成本管理功能
  - [x] 6.1 创建 `ExtraCostModal` 组件：接收 `goodsId` 和 `extraCosts` 数组作为 props
  - [x] 6.2 实现额外成本列表展示：表格形式显示金额、描述、创建时间
  - [x] 6.3 实现总金额汇总：在列表底部或顶部显示所有额外成本的合计金额
  - [x] 6.4 实现添加额外成本：表单输入金额（必填）和描述（选填），调用 `sysGoodsControllerAddExtraCost` API
  - [x] 6.5 实现删除额外成本：每行提供删除按钮，Popconfirm 确认后调用 `sysGoodsControllerDeleteExtraCost` API
  - [x] 6.6 在主页面操作列添加"额外成本"按钮，点击打开 `ExtraCostModal`

- [x] 7.0 实现商品导入与模板下载功能
  - [x] 7.1 安装 `browser-fs-access` 依赖：`pnpm add browser-fs-access`
  - [x] 7.2 实现模板下载功能：创建 `handleDownloadTemplate` 函数，通过 a 标签下载 `/template/商品信息导入模板.xlsx`
  - [x] 7.3 实现文件选择功能：使用 `fileOpen` API，限制 mimeTypes 为 xlsx/xls
  - [x] 7.4 创建 `ImportResultModal` 组件：展示成功数量、失败数量、错误信息列表
  - [x] 7.5 实现导入流程：选择文件 → 调用 `sysGoodsControllerImportGoods` API → 显示结果弹窗 → 成功后刷新列表
  - [x] 7.6 在工具栏使用 `CrudToolbar` 的 `extraActions` 配置"下载模板"和"导入商品"按钮

---

**状态**: ✅ 已完成  
**创建日期**: 2025-12-03  
**完成日期**: 2025-12-03
