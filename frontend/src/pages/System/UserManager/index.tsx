import { CrudPage, type SearchFieldConfig } from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo } from 'react';
import api from 'services';
import type { CreateUserDto, RoleEntity, UpdateUserBodyDto, UserEntity, UserQueryDto } from 'services/generated/model';
import { Form, Input, Select, Switch, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

const { FormItem } = Form;

/** 禁用状态选项 */
const DISABLED_OPTIONS = [
  { label: '全部', value: '' },
  { label: '正常', value: 'false' },
  { label: '禁用', value: 'true' },
];

/** 获取角色列表 */
const fetchRoleOptions = async () => {
  const res = await api.sysRoleControllerGetRoles({ current: 1, pageSize: 100 });
  const roles = res.data?.list || [];
  return [{ label: '全部', value: '' }, ...roles.map((role: RoleEntity) => ({ label: role.name, value: role.id }))];
};

/** 获取角色选项（不含"全部"） */
const fetchRoleOptionsForForm = async () => {
  const res = await api.sysRoleControllerGetRoles({ current: 1, pageSize: 100 });
  const roles = res.data?.list || [];
  return roles.map((role: RoleEntity) => ({ label: role.name, value: role.id }));
};

/** 搜索字段配置 */
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
  { name: 'roleId', label: '所属角色', type: 'select', request: fetchRoleOptions },
];

/** 表格列配置 */
const columns: PrimaryTableCol<UserEntity>[] = [
  { title: '用户名', colKey: 'username', fixed: 'left', width: 150 },
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
    title: '所属角色',
    colKey: 'roles',
    width: 200,
    cell: ({ row }) => (
      <div>
        {row.roles?.map((role: { id: string; name: string }) => (
          <Tag key={role.id} style={{ marginRight: 4 }}>
            {role.name}
          </Tag>
        )) || '-'}
      </div>
    ),
  },
  {
    title: '创建时间',
    colKey: 'createdAt',
    width: 180,
    cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
];

/** 用户表单字段组件 */
const UserFormFields: React.FC<{ isEdit: boolean }> = ({ isEdit }) => {
  const [roleOptions, setRoleOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [roleLoading, setRoleLoading] = React.useState(false);

  React.useEffect(() => {
    const loadRoles = async () => {
      setRoleLoading(true);
      try {
        const options = await fetchRoleOptionsForForm();
        setRoleOptions(options);
      } finally {
        setRoleLoading(false);
      }
    };
    loadRoles();
  }, []);

  return (
    <>
      <FormItem
        label='用户名'
        name='username'
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 2, message: '用户名至少2个字符' },
          { max: 16, message: '用户名最多16个字符' },
        ]}
      >
        <Input placeholder='请输入用户名' />
      </FormItem>
      <FormItem
        label='密码'
        name='password'
        rules={
          isEdit
            ? [
                { min: 6, message: '密码至少6个字符' },
                { max: 16, message: '密码最多16个字符' },
              ]
            : [
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
                { max: 16, message: '密码最多16个字符' },
              ]
        }
      >
        <Input type='password' placeholder={isEdit ? '留空则不修改密码' : '请输入密码'} />
      </FormItem>
      <FormItem label='状态' name='disabled' initialData={false}>
        <Switch customValue={[true, false]} label={['禁用', '正常']} />
      </FormItem>
      <FormItem label='关联角色' name='roleIds' initialData={[]}>
        <Select options={roleOptions} placeholder='请选择角色' multiple loading={roleLoading} />
      </FormItem>
    </>
  );
};

const UserManager: React.FC = () => {
  return (
    <CrudPage<UserEntity, UserQueryDto, CreateUserDto, UpdateUserBodyDto>
      api={{
        list: api.sysUserControllerGetUsers,
        create: api.sysUserControllerCreateUser,
        update: api.sysUserControllerUpdateUser,
        delete: api.sysUserControllerDeleteUser,
      }}
      searchFields={searchFields}
      columns={columns}
      formConfig={{
        title: { add: '新增用户', edit: '编辑用户' },
        width: 500,
        renderForm: (isEdit) => <UserFormFields isEdit={isEdit} />,
        fillForm: (editData) => ({
          username: editData.username,
          disabled: editData.disabled,
          roleIds: editData.roles?.map((r) => r.id) || [],
        }),
        transformValues: (values, isEdit, editData) => ({
          ...(isEdit && editData ? { id: editData.id } : {}),
          username: (values as Record<string, unknown>).username,
          password: (values as Record<string, unknown>).password || undefined,
          disabled: (values as Record<string, unknown>).disabled,
          roleIds: (values as Record<string, unknown>).roleIds,
        }),
      }}
      toolbar={{ primaryLabel: '新增用户' }}
      operations={[
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除', danger: true, confirm: '确定要删除该用户吗？' },
      ]}
      deleteConfirmText='确定要删除该用户吗？'
    />
  );
};

export default memo(UserManager);
