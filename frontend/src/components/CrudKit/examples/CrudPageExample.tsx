/**
 * 示例：标准 CRUD 页面（配置化）
 * 适用场景：增删改查完整功能的管理页面
 * 使用方式：复制此文件到 src/pages/YourModule/ 目录，按需修改
 */
import { CrudPage, type SearchFieldConfig } from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo } from 'react';
import { Form, Input, Switch, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
// TODO: 替换为实际的 API 和类型
// import api from 'services';
// import type { CreateXxxDto, UpdateXxxBodyDto, XxxEntity, XxxQueryDto } from 'services/generated/model';

const { FormItem } = Form;

// ============ 类型定义（TODO: 替换为实际类型） ============
interface ExampleEntity {
  id: string;
  name: string;
  description?: string;
  disabled: boolean;
  createdAt: string;
}

interface ExampleQueryDto {
  current: number;
  pageSize: number;
  keywords?: string;
  disabled?: boolean;
}

interface CreateExampleDto {
  name: string;
  description?: string;
  disabled?: boolean;
}

interface UpdateExampleDto extends CreateExampleDto {
  id: string;
}

// ============ 模拟 API（TODO: 替换为实际 API） ============
const mockApi = {
  getList: async (params: ExampleQueryDto) => ({
    data: {
      list: [
        { id: '1', name: '示例数据1', description: '这是描述', disabled: false, createdAt: new Date().toISOString() },
        { id: '2', name: '示例数据2', description: '这是描述2', disabled: true, createdAt: new Date().toISOString() },
      ],
      total: 2,
    },
  }),
  create: async (data: CreateExampleDto) => ({ data: { id: '3', ...data } }),
  update: async (data: UpdateExampleDto) => ({ data }),
  delete: async (id: string) => ({ data: { id } }),
};

// ============ 常量配置 ============
/** 禁用状态选项 */
const DISABLED_OPTIONS = [
  { label: '全部', value: '' },
  { label: '正常', value: 'false' },
  { label: '禁用', value: 'true' },
];

// ============ 搜索字段配置 ============
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '名称', type: 'input', placeholder: '请输入名称' },
  {
    name: 'disabled',
    label: '状态',
    type: 'select',
    options: DISABLED_OPTIONS,
    // 值转换：将字符串转为布尔值
    transform: (value) => {
      if (value === 'true') return { disabled: true };
      if (value === 'false') return { disabled: false };
      return {};
    },
  },
  // 更多字段类型示例：
  // { name: 'categoryId', label: '分类', type: 'select', request: fetchCategoryOptions },
  // { name: 'createdAt', label: '创建日期', type: 'date' },
  // { name: 'dateRange', label: '日期范围', type: 'dateRange' },
];

// ============ 表格列配置 ============
const columns: PrimaryTableCol<ExampleEntity>[] = [
  { title: '名称', colKey: 'name', fixed: 'left', width: 150 },
  { title: '描述', colKey: 'description', width: 200, cell: ({ row }) => row.description || '-' },
  {
    title: '状态',
    colKey: 'disabled',
    width: 100,
    cell: ({ row }) => (
      <Tag theme={row.disabled ? 'danger' : 'success'} variant='light'>
        {row.disabled ? '禁用' : '正常'}
      </Tag>
    ),
  },
  {
    title: '创建时间',
    colKey: 'createdAt',
    width: 180,
    cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
];

// ============ 表单字段组件 ============
const FormFields: React.FC<{ isEdit: boolean }> = ({ isEdit }) => (
  <>
    <FormItem
      label='名称'
      name='name'
      rules={[
        { required: true, message: '请输入名称' },
        { min: 2, message: '名称至少2个字符' },
        { max: 32, message: '名称最多32个字符' },
      ]}
    >
      <Input placeholder='请输入名称' />
    </FormItem>
    <FormItem label='描述' name='description'>
      <Input placeholder='请输入描述' />
    </FormItem>
    <FormItem label='状态' name='disabled' initialData={false}>
      <Switch customValue={[true, false]} label={['禁用', '正常']} />
    </FormItem>
  </>
);

// ============ 页面组件 ============
const CrudPageExample: React.FC = () => {
  return (
    <CrudPage<ExampleEntity, ExampleQueryDto, CreateExampleDto, UpdateExampleDto>
      // API 配置
      api={{
        list: mockApi.getList,
        create: mockApi.create,
        update: mockApi.update,
        delete: mockApi.delete,
      }}
      // 搜索字段
      searchFields={searchFields}
      // 表格列
      columns={columns}
      // 表单配置
      formConfig={{
        title: { add: '新增数据', edit: '编辑数据' },
        width: 500,
        renderForm: (isEdit) => <FormFields isEdit={isEdit} />,
        // 编辑时填充表单数据
        fillForm: (editData) => ({
          name: editData.name,
          description: editData.description || '',
          disabled: editData.disabled,
        }),
        // 提交前转换数据
        transformValues: (values, isEdit, editData) => ({
          ...(isEdit && editData ? { id: editData.id } : {}),
          name: (values as Record<string, unknown>).name,
          description: (values as Record<string, unknown>).description || undefined,
          disabled: (values as Record<string, unknown>).disabled,
        }),
      }}
      // 工具栏
      toolbar={{ primaryLabel: '新增数据' }}
      // 操作列
      operations={[
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除', danger: true, confirm: '确定要删除该数据吗？' },
      ]}
      // 其他配置
      defaultPageSize={10}
      rowKey='id'
    />
  );
};

export default memo(CrudPageExample);

