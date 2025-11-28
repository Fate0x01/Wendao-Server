# CrudKit - CRUD 页面组件工具库

CrudKit 是一套分层的 CRUD 组件体系，提供从底层 Hooks 到中层组件再到顶层配置化页面的完整解决方案。

## 架构分层

```
┌─────────────────────────────────────────────┐
│           CrudPage（配置化页面）              │  ← 顶层：一个配置生成完整页面
├─────────────────────────────────────────────┤
│  CrudSearchForm │ CrudTable │ CrudFormModal │  ← 中层：可组合的基础组件
├─────────────────────────────────────────────┤
│  useCrudTable │ useCrudModal │ useSelection │  ← 底层：状态管理 Hooks
└─────────────────────────────────────────────┘
```

## 使用场景

| 场景 | 推荐方式 |
|------|---------|
| 标准 CRUD（如用户/角色管理） | 直接用 `CrudPage` 配置化 |
| 仅查询 + 导出 | `useCrudTable` + `CrudSearchForm` + `CrudToolbar` 组合 |
| 复杂操作列 | `useCrudTable` + `OperationColumn` 自定义按钮 |
| 自定义弹窗表单 | `useCrudModal` + 业务自定义 Modal 组件 |

---

## 一、底层 Hooks

### useCrudTable

管理表格核心状态：分页、筛选、数据获取、刷新。

```typescript
import { useCrudTable } from 'components/CrudKit';

const {
  list,           // 数据列表
  total,          // 总条数
  loading,        // 加载状态
  filters,        // 当前筛选条件
  setFilters,     // 设置筛选条件
  refresh,        // 刷新数据
  handleSearch,   // 搜索处理（重置到第一页）
  handleReset,    // 重置筛选条件
  handlePageChange, // 分页变化处理
} = useCrudTable({
  fetchApi: (params) => api.getUsers(params),
  defaultFilters: { current: 1, pageSize: 10 },
  defaultPageSize: 10,
});
```

### useCrudModal

管理弹窗状态：新增/编辑模式、表单数据填充、提交逻辑。

```typescript
import { useCrudModal } from 'components/CrudKit';

const {
  visible,        // 弹窗可见状态
  editData,       // 编辑数据
  isEdit,         // 是否编辑模式
  formRef,        // 表单引用
  loading,        // 加载状态
  openAdd,        // 打开新增弹窗
  openEdit,       // 打开编辑弹窗
  close,          // 关闭弹窗
  handleSubmit,   // 提交处理
} = useCrudModal({
  createApi: (data) => api.createUser(data),
  updateApi: (data) => api.updateUser(data),
  onSuccess: refresh,
  successMessage: { create: '创建成功', update: '更新成功' },
});
```

### useTableSelection

管理表格多选状态，支持批量操作场景。

```typescript
import { useTableSelection } from 'components/CrudKit';

const {
  selectedRowKeys,      // 选中的行 keys
  selectedRows,         // 选中的行数据
  setSelectedRowKeys,   // 设置选中行
  handleSelectionChange, // 选择变化处理
  clearSelection,       // 清空选择
} = useTableSelection<UserEntity>();
```

---

## 二、中层组件

### CrudSearchForm

配置化搜索表单，支持多种字段类型。

```typescript
import { CrudSearchForm, type SearchFieldConfig } from 'components/CrudKit';

const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '关键词', type: 'input' },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
  { name: 'roleId', label: '角色', type: 'select', request: fetchRoleOptions },
  { name: 'createdAt', label: '创建日期', type: 'date' },
  { name: 'dateRange', label: '日期范围', type: 'dateRange' },
];

<CrudSearchForm
  fields={searchFields}
  onSearch={handleSearch}
  onReset={handleReset}
  labelWidth={80}
/>
```

**字段配置项：**

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 字段名 |
| label | string | 标签 |
| type | 'input' \| 'select' \| 'date' \| 'dateRange' | 字段类型 |
| placeholder | string | 占位符 |
| options | Array<{label, value}> | 选项（select 类型） |
| request | () => Promise<Array<{label, value}>> | 异步获取选项 |
| span | number | 栅格宽度（默认 3） |
| transform | (value) => unknown | 值转换器 |

### OperationColumn

操作列渲染器，支持自定义按钮组合。

```typescript
import { OperationColumn, type ActionConfig } from 'components/CrudKit';

const actions: ActionConfig<UserEntity>[] = [
  { key: 'edit', label: '编辑', onClick: (record) => openEdit(record) },
  { key: 'delete', label: '删除', danger: true, confirm: '确定删除？', onClick: handleDelete },
  { key: 'custom', label: '自定义', hidden: (record) => record.isSystem },
];

// 在表格列中使用
{
  title: '操作',
  colKey: 'operation',
  cell: ({ row }) => <OperationColumn record={row} actions={actions} />,
}
```

### CrudFormModal

通用表单弹窗壳，支持 renderForm 自定义内容。

```typescript
import { CrudFormModal } from 'components/CrudKit';

<CrudFormModal
  title={{ add: '新增用户', edit: '编辑用户' }}
  visible={visible}
  isEdit={isEdit}
  formRef={formRef}
  loading={loading}
  width={500}
  onClose={close}
  onSubmit={handleSubmit}
  onOpened={() => {
    // 弹窗打开后填充表单数据
    if (editData) {
      formRef.current?.setFieldsValue(editData);
    }
  }}
  renderForm={(isEdit) => (
    <>
      <FormItem name="username" label="用户名">
        <Input />
      </FormItem>
    </>
  )}
/>
```

### CrudToolbar

工具栏组件，支持新增、导入、导出、批量操作等按钮。

```typescript
import { CrudToolbar, type ToolbarActionConfig } from 'components/CrudKit';

const extraActions: ToolbarActionConfig[] = [
  { key: 'import', label: '导入', icon: <UploadIcon />, onClick: handleImport },
  { key: 'export', label: '导出', icon: <DownloadIcon />, onClick: handleExport },
];

const batchActions: ToolbarActionConfig[] = [
  { key: 'batchDelete', label: '批量删除', danger: true, onClick: handleBatchDelete },
];

<CrudToolbar
  primaryAction={{ label: '新增用户', onClick: openAdd }}
  extraActions={extraActions}
  batchActions={batchActions}
  selectedCount={selectedRowKeys.length}
/>
```

---

## 三、顶层配置化组件

### CrudPage

一个配置对象生成完整 CRUD 页面，适合标准 CRUD 场景。

```typescript
import { CrudPage, type SearchFieldConfig } from 'components/CrudKit';
import type { CreateUserDto, UpdateUserBodyDto, UserEntity, UserQueryDto } from 'services/generated/model';

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '用户名', type: 'input' },
  {
    name: 'disabled',
    label: '状态',
    type: 'select',
    options: DISABLED_OPTIONS,
    transform: (value) => {
      if (value === 'true') return { disabled: true };
      if (value === 'false') return { disabled: false };
      return {};
    },
  },
];

// 表格列配置
const columns: PrimaryTableCol<UserEntity>[] = [
  { title: '用户名', colKey: 'username', width: 150 },
  { title: '状态', colKey: 'disabled', width: 100, cell: ({ row }) => <Tag>{row.disabled ? '禁用' : '正常'}</Tag> },
];

// 使用 CrudPage
<CrudPage<UserEntity, UserQueryDto, CreateUserDto, UpdateUserBodyDto>
  // API 配置
  api={{
    list: api.sysUserControllerGetUsers,
    create: api.sysUserControllerCreateUser,
    update: api.sysUserControllerUpdateUser,
    delete: api.sysUserControllerDeleteUser,
  }}
  // 搜索字段
  searchFields={searchFields}
  // 表格列
  columns={columns}
  // 表单配置
  formConfig={{
    title: { add: '新增用户', edit: '编辑用户' },
    width: 500,
    renderForm: (isEdit) => <UserFormFields isEdit={isEdit} />,
    fillForm: (editData) => ({
      username: editData.username,
      disabled: editData.disabled,
    }),
    transformValues: (values, isEdit, editData) => ({
      ...(isEdit && editData ? { id: editData.id } : {}),
      ...values,
    }),
  }}
  // 工具栏
  toolbar={{
    primaryLabel: '新增用户',
    extra: [{ key: 'export', label: '导出', onClick: handleExport }],
  }}
  // 操作列
  operations={[
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true, confirm: '确定删除该用户？' },
  ]}
  // 其他配置
  defaultPageSize={10}
  rowKey="id"
/>
```

**CrudPage Props：**

| 属性 | 类型 | 说明 |
|------|------|------|
| api | CrudPageApiConfig | API 配置（list/create/update/delete） |
| searchFields | SearchFieldConfig[] | 搜索字段配置 |
| columns | PrimaryTableCol[] | 表格列配置 |
| formConfig | CrudPageFormConfig | 表单弹窗配置 |
| toolbar | CrudPageToolbarConfig | 工具栏配置 |
| operations | ActionConfig[] | 操作列配置 |
| hideOperations | boolean | 隐藏操作列 |
| rowSelection | boolean | 是否启用行选择 |
| batchActions | ToolbarActionConfig[] | 批量操作按钮 |
| defaultFilters | Partial<TFilters> | 默认筛选条件 |
| defaultPageSize | number | 默认分页大小 |
| rowKey | string | 表格行 key |
| deleteConfirmText | string | 删除确认文案 |

---

## 四、类型导出

```typescript
import type {
  // 分页相关
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  // API 函数类型
  ListApiFn,
  CreateApiFn,
  UpdateApiFn,
  DeleteApiFn,
  // Hook 相关
  UseCrudTableOptions,
  UseCrudTableReturn,
  UseCrudModalOptions,
  UseCrudModalReturn,
  UseTableSelectionReturn,
  // 搜索表单
  SearchFieldType,
  SearchFieldConfig,
  CrudSearchFormProps,
  // 操作列
  ActionConfig,
  OperationColumnProps,
  // 工具栏
  ToolbarActionConfig,
  CrudToolbarProps,
  // 表单弹窗
  CrudFormModalProps,
  // CrudPage
  CrudPageApiConfig,
  CrudPageFormConfig,
  CrudPageToolbarConfig,
  CrudPageProps,
} from 'components/CrudKit';
```

---

## 五、示例文件

位于 `examples/` 目录，可直接复制到业务目录后修改使用：

| 文件 | 场景 | 说明 |
|------|------|------|
| `CrudPageExample.tsx` | 标准 CRUD | 配置化完整增删改查页面 |
| `QueryOnlyExample.tsx` | 仅查询+导出 | 日志、记录类展示页面 |
| `CustomModalExample.tsx` | 自定义弹窗 | 复杂表单或自定义操作 |
| `BatchOperationExample.tsx` | 批量操作 | 多选批量删除/导出 |

**使用方式：**
1. 选择合适的示例文件
2. 复制到 `src/pages/YourModule/` 目录
3. 修改类型定义、API、配置等
4. 删除 mock 数据，替换为实际 API

---

## 六、最佳实践

1. **标准 CRUD 页面**：直接使用 `CrudPage`，通过配置快速生成
2. **仅查询页面**：使用 `useCrudTable` + `CrudSearchForm`
3. **需要额外按钮**：使用 `CrudToolbar` 的 `extraActions`
4. **复杂操作列**：自定义 `operations` 或使用 `OperationColumn`
5. **批量操作**：启用 `rowSelection` + `batchActions`
6. **自定义弹窗**：使用 `useCrudModal` + 自定义 Modal 组件

