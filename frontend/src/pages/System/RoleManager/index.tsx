import { CrudPage, type SearchFieldConfig } from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo } from 'react';
import api from 'services';
import type { CreateRoleDto, RoleEntity, RoleQueryDto, UpdateRoleBodyDto } from 'services/generated/model';
import { Form, Input, Switch, Tag, Textarea } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import PermissionTree from './components/PermissionTree';

const { FormItem } = Form;

/** 禁用状态选项 */
const DISABLED_OPTIONS = [
  { label: '全部', value: '' },
  { label: '正常', value: 'false' },
  { label: '禁用', value: 'true' },
];

/** 搜索字段配置 */
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '角色名称', type: 'input' },
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

/** 表格列配置 */
const columns: PrimaryTableCol<RoleEntity>[] = [
  { title: '角色名称', colKey: 'name', fixed: 'left', width: 150 },
  { title: '描述', colKey: 'desc', width: 200, cell: ({ row }) => row.desc || '-' },
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
    title: '权限数量',
    colKey: 'permissions',
    width: 100,
    cell: ({ row }) => <Tag variant='light'>{row.permissions?.length || 0}</Tag>,
  },
  {
    title: '创建时间',
    colKey: 'createdAt',
    width: 180,
    cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
];

/** 表单字段渲染 */
const renderFormFields = () => (
  <>
    <FormItem
      label='角色名称'
      name='name'
      rules={[
        { required: true, message: '请输入角色名称' },
        { min: 2, message: '角色名称至少2个字符' },
        { max: 16, message: '角色名称最多16个字符' },
      ]}
    >
      <Input placeholder='请输入角色名称' />
    </FormItem>
    <FormItem label='描述' name='desc'>
      <Textarea placeholder='请输入角色描述' rows={3} />
    </FormItem>
    <FormItem label='状态' name='disabled' initialData={false}>
      <Switch customValue={[true, false]} label={['禁用', '正常']} />
    </FormItem>
    <FormItem label='权限配置' name='permissionIds' initialData={[]}>
      <PermissionTree />
    </FormItem>
  </>
);

const RoleManager: React.FC = () => {
  return (
    <CrudPage<RoleEntity, RoleQueryDto, CreateRoleDto, UpdateRoleBodyDto>
      api={{
        list: api.sysRoleControllerGetRoles,
        create: api.sysRoleControllerCreateRole,
        update: api.sysRoleControllerUpdateRole,
        delete: api.sysRoleControllerDeleteRole,
      }}
      searchFields={searchFields}
      columns={columns}
      formConfig={{
        title: { add: '新增角色', edit: '编辑角色' },
        width: 600,
        renderForm: renderFormFields,
        fillForm: (editData) => ({
          name: editData.name,
          desc: editData.desc || '',
          disabled: editData.disabled,
          permissionIds: editData.permissions?.map((p) => p.id) || [],
        }),
        transformValues: (values, isEdit, editData) => ({
          ...(isEdit && editData ? { id: editData.id } : {}),
          name: (values as Record<string, unknown>).name,
          desc: (values as Record<string, unknown>).desc || undefined,
          disabled: (values as Record<string, unknown>).disabled,
          permissionIds: (values as Record<string, unknown>).permissionIds,
        }),
      }}
      toolbar={{ primaryLabel: '新增角色' }}
      operations={[
        { key: 'edit', label: '编辑' },
        {
          key: 'delete',
          label: '删除',
          danger: true,
          confirm: '确定要删除该角色吗？',
          disabled: (record) => record.isSystem,
        },
      ]}
      deleteConfirmText='确定要删除该角色吗？'
    />
  );
};

export default memo(RoleManager);
