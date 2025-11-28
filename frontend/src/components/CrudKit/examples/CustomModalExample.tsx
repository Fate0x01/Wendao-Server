/**
 * 示例：自定义弹窗表单页面
 * 适用场景：需要完全自定义弹窗内容，或弹窗逻辑复杂
 * 使用方式：复制此文件到 src/pages/YourModule/ 目录，按需修改
 */
import {
  CrudSearchForm,
  CrudToolbar,
  OperationColumn,
  useCrudModal,
  useCrudTable,
  type ActionConfig,
  type SearchFieldConfig,
} from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo, useCallback, useMemo } from 'react';
import { Card, Dialog, Form, Input, MessagePlugin, Table, Tag, Textarea } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
// TODO: 替换为实际的 API 和类型
// import api from 'services';

const { FormItem } = Form;

// ============ 类型定义（TODO: 替换为实际类型） ============
interface ArticleEntity {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
}

interface ArticleQueryDto {
  current: number;
  pageSize: number;
  keywords?: string;
  status?: string;
}

interface CreateArticleDto {
  title: string;
  content: string;
}

interface UpdateArticleDto extends CreateArticleDto {
  id: string;
}

// ============ 模拟 API（TODO: 替换为实际 API） ============
const mockApi = {
  getList: async (params: ArticleQueryDto) => ({
    data: {
      list: [
        { id: '1', title: '文章标题1', content: '文章内容...', status: 'published' as const, createdAt: new Date().toISOString() },
        { id: '2', title: '文章标题2', content: '文章内容...', status: 'draft' as const, createdAt: new Date().toISOString() },
      ],
      total: 2,
    },
  }),
  create: async (data: CreateArticleDto) => ({ data: { id: '3', ...data } }),
  update: async (data: UpdateArticleDto) => ({ data }),
  delete: async (id: string) => ({ data: { id } }),
  publish: async (id: string) => ({ data: { id } }),
};

// ============ 常量配置 ============
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
];

// ============ 搜索字段配置 ============
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '标题', type: 'input', placeholder: '请输入标题' },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
];

// ============ 页面组件 ============
const CustomModalExample: React.FC = () => {
  // 表格状态
  const { list, total, loading, filters, refresh, handleSearch, handleReset, handlePageChange } = useCrudTable<
    ArticleEntity,
    ArticleQueryDto
  >({
    fetchApi: mockApi.getList,
    defaultPageSize: 10,
  });

  // 弹窗状态
  const { visible, editData, isEdit, formRef, loading: modalLoading, openAdd, openEdit, close, handleSubmit } =
    useCrudModal<ArticleEntity, CreateArticleDto, UpdateArticleDto>({
      createApi: mockApi.create,
      updateApi: mockApi.update,
      onSuccess: refresh,
    });

  // 删除处理
  const handleDelete = useCallback(
    async (record: ArticleEntity) => {
      try {
        await mockApi.delete(record.id);
        MessagePlugin.success('删除成功');
        refresh();
      } catch {
        MessagePlugin.error('删除失败');
      }
    },
    [refresh],
  );

  // 发布处理（自定义操作示例）
  const handlePublish = useCallback(
    async (record: ArticleEntity) => {
      try {
        await mockApi.publish(record.id);
        MessagePlugin.success('发布成功');
        refresh();
      } catch {
        MessagePlugin.error('发布失败');
      }
    },
    [refresh],
  );

  // 弹窗打开后填充数据
  const handleDialogOpened = useCallback(() => {
    if (editData) {
      formRef.current?.setFieldsValue({
        title: editData.title,
        content: editData.content,
      });
    } else {
      formRef.current?.reset?.();
    }
  }, [editData, formRef]);

  // 表单提交
  const onSubmit = useCallback(() => {
    handleSubmit((values: { title: string; content: string }) => ({
      ...(isEdit && editData ? { id: editData.id } : {}),
      title: values.title,
      content: values.content,
    }));
  }, [handleSubmit, isEdit, editData]);

  // 操作列配置（含自定义操作）
  const actions = useMemo<ActionConfig<ArticleEntity>[]>(
    () => [
      { key: 'edit', label: '编辑', onClick: openEdit },
      {
        key: 'publish',
        label: '发布',
        onClick: handlePublish,
        // 已发布的隐藏发布按钮
        hidden: (record) => record.status === 'published',
      },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        confirm: '确定要删除该文章吗？',
        onClick: handleDelete,
      },
    ],
    [openEdit, handlePublish, handleDelete],
  );

  // 表格列配置
  const columns = useMemo<PrimaryTableCol<ArticleEntity>[]>(
    () => [
      { title: '标题', colKey: 'title', width: 200 },
      {
        title: '状态',
        colKey: 'status',
        width: 100,
        cell: ({ row }) => (
          <Tag theme={row.status === 'published' ? 'success' : 'warning'} variant='light'>
            {row.status === 'published' ? '已发布' : '草稿'}
          </Tag>
        ),
      },
      {
        title: '创建时间',
        colKey: 'createdAt',
        width: 180,
        cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: '操作',
        colKey: 'operation',
        fixed: 'right',
        width: 200,
        cell: ({ row }) => <OperationColumn record={row} actions={actions} />,
      },
    ],
    [actions],
  );

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      <Card bordered={false}>
        <CrudSearchForm fields={searchFields} onSearch={handleSearch} onReset={handleReset} />
      </Card>

      {/* 表格区域 */}
      <Card bordered={false}>
        <CrudToolbar primaryAction={{ label: '新增文章', onClick: openAdd }} />

        <Table
          loading={loading}
          data={list}
          columns={columns}
          rowKey='id'
          hover
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* 自定义弹窗 */}
      <Dialog
        header={isEdit ? '编辑文章' : '新增文章'}
        visible={visible}
        width={600}
        confirmLoading={modalLoading}
        onClose={close}
        onConfirm={onSubmit}
        onOpened={handleDialogOpened}
      >
        <Form ref={formRef} labelWidth={80} colon>
          <FormItem
            label='标题'
            name='title'
            rules={[
              { required: true, message: '请输入标题' },
              { max: 100, message: '标题最多100个字符' },
            ]}
          >
            <Input placeholder='请输入文章标题' />
          </FormItem>
          <FormItem label='内容' name='content' rules={[{ required: true, message: '请输入内容' }]}>
            <Textarea placeholder='请输入文章内容' rows={6} />
          </FormItem>
        </Form>
      </Dialog>
    </div>
  );
};

export default memo(CustomModalExample);

