import type { ReactNode } from 'react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

/** 分页参数 */
export interface PaginationParams {
  current: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  list?: T[];
  total?: number;
}

/** API 响应包装 */
export interface ApiResponse<T> {
  data?: T;
}

/** 更宽松的 API 函数类型，兼容 orval 生成的类型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListApiFn<TData, TFilters> = (
  params: TFilters,
  options?: any,
) => Promise<{ data?: { list?: TData[]; total?: number } }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateApiFn<TCreateDto> = (data: TCreateDto, options?: any) => Promise<unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpdateApiFn<TUpdateDto> = (data: TUpdateDto, options?: any) => Promise<unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DeleteApiFn = (id: string, options?: any) => Promise<unknown>;

/** useCrudTable 配置 */
export interface UseCrudTableOptions<TData, TFilters extends PaginationParams> {
  /** 列表查询 API */
  fetchApi: ListApiFn<TData, TFilters>;
  /** 默认筛选条件 */
  defaultFilters?: Partial<TFilters>;
  /** 默认分页大小 */
  defaultPageSize?: number;
}

/** useCrudTable 返回值 */
export interface UseCrudTableReturn<TData, TFilters extends PaginationParams> {
  /** 数据列表 */
  list: TData[];
  /** 总条数 */
  total: number;
  /** 加载状态 */
  loading: boolean;
  /** 当前筛选条件 */
  filters: TFilters;
  /** 设置筛选条件 */
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;
  /** 刷新数据 */
  refresh: () => void;
  /** 搜索处理（重置到第一页） */
  handleSearch: (values: Partial<TFilters>) => void;
  /** 重置筛选条件 */
  handleReset: () => void;
  /** 分页变化处理 */
  handlePageChange: (pageInfo: { current: number; pageSize: number }) => void;
}

/** useCrudModal 配置 */
export interface UseCrudModalOptions<TData, TCreateDto, TUpdateDto> {
  /** 创建 API */
  createApi?: CreateApiFn<TCreateDto>;
  /** 更新 API */
  updateApi?: UpdateApiFn<TUpdateDto>;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 成功提示文案 */
  successMessage?: { create?: string; update?: string };
  /** 失败提示文案 */
  errorMessage?: { create?: string; update?: string };
}

/** useCrudModal 返回值 */
export interface UseCrudModalReturn<TData> {
  /** 弹窗可见状态 */
  visible: boolean;
  /** 编辑数据 */
  editData: TData | null;
  /** 是否编辑模式 */
  isEdit: boolean;
  /** 表单引用 */
  formRef: React.RefObject<FormInstanceFunctions>;
  /** 加载状态 */
  loading: boolean;
  /** 打开新增弹窗 */
  openAdd: () => void;
  /** 打开编辑弹窗 */
  openEdit: (record: TData) => void;
  /** 关闭弹窗 */
  close: () => void;
  /** 提交处理 */
  handleSubmit: <TFormValues>(
    transformFn?: (values: TFormValues, isEdit: boolean, editData: TData | null) => unknown,
  ) => Promise<void>;
}

/** useTableSelection 返回值 */
export interface UseTableSelectionReturn<TData> {
  /** 选中的行 keys */
  selectedRowKeys: string[];
  /** 选中的行数据 */
  selectedRows: TData[];
  /** 设置选中行 */
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<string[]>>;
  /** 选择变化处理 */
  handleSelectionChange: (selectedRowKeys: string[], context: { selectedRowData: TData[] }) => void;
  /** 清空选择 */
  clearSelection: () => void;
}

/** 搜索字段类型 */
export type SearchFieldType = 'input' | 'select' | 'date' | 'dateRange';

/** 搜索字段配置 */
export interface SearchFieldConfig {
  /** 字段名 */
  name: string;
  /** 标签 */
  label: string;
  /** 字段类型 */
  type: SearchFieldType;
  /** 占位符 */
  placeholder?: string;
  /** 选项（select 类型） */
  options?: Array<{ label: string; value: string | number | boolean }>;
  /** 异步获取选项 */
  request?: () => Promise<Array<{ label: string; value: string | number | boolean }>>;
  /** 栅格宽度 */
  span?: number;
  /** 值转换器（表单值 -> 搜索参数） */
  transform?: (value: unknown) => unknown;
}

/** 操作按钮配置 */
export interface ActionConfig<TData = unknown> {
  /** 按钮标识 */
  key: string;
  /** 按钮文案 */
  label: string;
  /** 是否危险按钮 */
  danger?: boolean;
  /** 确认提示文案（有值则显示确认弹窗） */
  confirm?: string;
  /** 点击回调 */
  onClick?: (record: TData) => void | Promise<void>;
  /** 是否禁用 */
  disabled?: boolean | ((record: TData) => boolean);
  /** 是否隐藏 */
  hidden?: boolean | ((record: TData) => boolean);
}

/** 工具栏按钮配置 */
export interface ToolbarActionConfig {
  /** 按钮标识 */
  key?: string;
  /** 按钮文案 */
  label: string;
  /** 图标 */
  icon?: React.ReactElement;
  /** 是否危险按钮 */
  danger?: boolean;
  /** 点击回调 */
  onClick?: () => void | Promise<void>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮主题 */
  theme?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
}

/** CrudSearchForm Props */
export interface CrudSearchFormProps {
  /** 搜索字段配置 */
  fields: SearchFieldConfig[];
  /** 搜索回调 */
  onSearch: (values: Record<string, unknown>) => void;
  /** 重置回调 */
  onReset: () => void;
  /** 标签宽度 */
  labelWidth?: number;
}

/** OperationColumn Props */
export interface OperationColumnProps<TData> {
  /** 当前行数据 */
  record: TData;
  /** 操作按钮配置 */
  actions: ActionConfig<TData>[];
  /** 额外自定义内容 */
  extra?: ReactNode;
}

/** CrudFormModal Props */
export interface CrudFormModalProps {
  /** 弹窗标题 */
  title: { add: string; edit: string };
  /** 是否可见 */
  visible: boolean;
  /** 是否编辑模式 */
  isEdit: boolean;
  /** 表单引用 */
  formRef: React.RefObject<FormInstanceFunctions>;
  /** 加载状态 */
  loading?: boolean;
  /** 弹窗宽度 */
  width?: number;
  /** 关闭回调 */
  onClose: () => void;
  /** 提交回调 */
  onSubmit: () => void;
  /** 弹窗打开后回调（用于填充表单数据） */
  onOpened?: () => void;
  /** 表单渲染函数 */
  renderForm: (isEdit: boolean) => ReactNode;
  /** 标签宽度 */
  labelWidth?: number;
}

/** CrudToolbar Props */
export interface CrudToolbarProps {
  /** 主操作按钮 */
  primaryAction?: { label: string; onClick: () => void };
  /** 额外操作按钮 */
  extraActions?: ToolbarActionConfig[];
  /** 批量操作按钮（选中行时显示） */
  batchActions?: ToolbarActionConfig[] | false;
  /** 选中行数（用于显示批量操作） */
  selectedCount?: number;
}

/** CrudPage API 配置 */
export interface CrudPageApiConfig<TData, TFilters, TCreateDto, TUpdateDto> {
  /** 列表查询 */
  list: ListApiFn<TData, TFilters>;
  /** 创建 */
  create?: CreateApiFn<TCreateDto>;
  /** 更新 */
  update?: UpdateApiFn<TUpdateDto>;
  /** 删除 */
  delete?: DeleteApiFn;
}

/** CrudPage 表单配置 */
export interface CrudPageFormConfig<TData> {
  /** 弹窗标题 */
  title: { add: string; edit: string };
  /** 弹窗宽度 */
  width?: number;
  /** 表单渲染函数 */
  renderForm: (isEdit: boolean, editData: TData | null) => ReactNode;
  /** 表单值转换（提交前） */
  transformValues?: (values: Record<string, unknown>, isEdit: boolean, editData: TData | null) => unknown;
  /** 编辑时填充表单数据 */
  fillForm?: (editData: TData) => Record<string, unknown>;
}

/** CrudPage 工具栏配置 */
export interface CrudPageToolbarConfig {
  /** 主按钮文案 */
  primaryLabel?: string;
  /** 隐藏主按钮 */
  hidePrimary?: boolean;
  /** 额外按钮 */
  extra?: ToolbarActionConfig[];
}

/** CrudPage Props */
export interface CrudPageProps<
  TData extends { id: string },
  TFilters extends PaginationParams,
  TCreateDto = unknown,
  TUpdateDto = unknown,
> {
  /** API 配置 */
  api: CrudPageApiConfig<TData, TFilters, TCreateDto, TUpdateDto>;
  /** 搜索字段配置 */
  searchFields?: SearchFieldConfig[];
  /** 表格列配置 */
  columns: PrimaryTableCol<TData>[];
  /** 表单配置 */
  formConfig?: CrudPageFormConfig<TData>;
  /** 工具栏配置 */
  toolbar?: CrudPageToolbarConfig;
  /** 操作列配置 */
  operations?: ActionConfig<TData>[];
  /** 隐藏操作列 */
  hideOperations?: boolean;
  /** 行选择配置 */
  rowSelection?: boolean;
  /** 批量操作按钮 */
  batchActions?: ToolbarActionConfig[];
  /** 默认筛选条件 */
  defaultFilters?: Partial<TFilters>;
  /** 默认分页大小 */
  defaultPageSize?: number;
  /** 表格行 key */
  rowKey?: string;
  /** 删除确认文案 */
  deleteConfirmText?: string;
}
