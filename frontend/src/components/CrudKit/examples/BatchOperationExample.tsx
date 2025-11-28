/**
 * 示例：批量操作页面
 * 适用场景：需要多选和批量操作功能
 * 使用方式：复制此文件到 src/pages/YourModule/ 目录，按需修改
 */
import {
  CrudSearchForm,
  CrudToolbar,
  OperationColumn,
  useCrudTable,
  useTableSelection,
  type ActionConfig,
  type SearchFieldConfig,
  type ToolbarActionConfig,
} from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo, useCallback, useMemo } from 'react';
import { DeleteIcon, DownloadIcon } from 'tdesign-icons-react';
import { Card, MessagePlugin, Table, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
// TODO: 替换为实际的 API 和类型
// import api from 'services';

// ============ 类型定义（TODO: 替换为实际类型） ============
interface TaskEntity {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
}

interface TaskQueryDto {
  current: number;
  pageSize: number;
  keywords?: string;
  status?: string;
}

// ============ 模拟 API（TODO: 替换为实际 API） ============
const mockApi = {
  getList: async (params: TaskQueryDto) => ({
    data: {
      list: [
        { id: '1', name: '任务1', status: 'completed' as const, progress: 100, createdAt: new Date().toISOString() },
        { id: '2', name: '任务2', status: 'running' as const, progress: 60, createdAt: new Date().toISOString() },
        { id: '3', name: '任务3', status: 'pending' as const, progress: 0, createdAt: new Date().toISOString() },
        { id: '4', name: '任务4', status: 'failed' as const, progress: 30, createdAt: new Date().toISOString() },
      ],
      total: 4,
    },
  }),
  batchDelete: async (ids: string[]) => ({ data: { ids } }),
  batchExport: async (ids: string[]) => ({ data: { ids } }),
};

// ============ 常量配置 ============
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待执行', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
];

const STATUS_THEME_MAP: Record<string, 'default' | 'primary' | 'success' | 'danger' | 'warning'> = {
  pending: 'default',
  running: 'primary',
  completed: 'success',
  failed: 'danger',
};

const STATUS_TEXT_MAP: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  completed: '已完成',
  failed: '失败',
};

// ============ 搜索字段配置 ============
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '任务名称', type: 'input', placeholder: '请输入任务名称' },
  { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS },
];

// ============ 页面组件 ============
const BatchOperationExample: React.FC = () => {
  // 表格状态
  const { list, total, loading, filters, refresh, handleSearch, handleReset, handlePageChange } = useCrudTable<
    TaskEntity,
    TaskQueryDto
  >({
    fetchApi: mockApi.getList,
    defaultPageSize: 10,
  });

  // 多选状态
  const { selectedRowKeys, selectedRows, handleSelectionChange, clearSelection } = useTableSelection<TaskEntity>();

  // 单行删除
  const handleDelete = useCallback(
    async (record: TaskEntity) => {
      try {
        await mockApi.batchDelete([record.id]);
        MessagePlugin.success('删除成功');
        refresh();
      } catch {
        MessagePlugin.error('删除失败');
      }
    },
    [refresh],
  );

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      MessagePlugin.warning('请先选择要删除的数据');
      return;
    }
    try {
      await mockApi.batchDelete(selectedRowKeys);
      MessagePlugin.success(`成功删除 ${selectedRowKeys.length} 条数据`);
      clearSelection();
      refresh();
    } catch {
      MessagePlugin.error('批量删除失败');
    }
  }, [selectedRowKeys, clearSelection, refresh]);

  // 批量导出
  const handleBatchExport = useCallback(async () => {
    const ids = selectedRowKeys.length > 0 ? selectedRowKeys : list.map((item) => item.id);
    try {
      await mockApi.batchExport(ids);
      MessagePlugin.success(`导出 ${ids.length} 条数据`);
    } catch {
      MessagePlugin.error('导出失败');
    }
  }, [selectedRowKeys, list]);

  // 操作列配置
  const actions = useMemo<ActionConfig<TaskEntity>[]>(
    () => [
      {
        key: 'delete',
        label: '删除',
        danger: true,
        confirm: '确定要删除该任务吗？',
        onClick: handleDelete,
      },
    ],
    [handleDelete],
  );

  // 批量操作按钮
  const batchActions = useMemo<ToolbarActionConfig[]>(
    () => [{ key: 'batchDelete', label: '批量删除', danger: true, icon: <DeleteIcon />, onClick: handleBatchDelete }],
    [handleBatchDelete],
  );

  // 额外操作按钮
  const extraActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        key: 'export',
        label: selectedRowKeys.length > 0 ? `导出选中(${selectedRowKeys.length})` : '导出全部',
        icon: <DownloadIcon />,
        onClick: handleBatchExport,
      },
    ],
    [selectedRowKeys.length, handleBatchExport],
  );

  // 表格列配置
  const columns = useMemo<PrimaryTableCol<TaskEntity>[]>(
    () => [
      { title: '任务名称', colKey: 'name', width: 200 },
      {
        title: '状态',
        colKey: 'status',
        width: 100,
        cell: ({ row }) => (
          <Tag theme={STATUS_THEME_MAP[row.status]} variant='light'>
            {STATUS_TEXT_MAP[row.status]}
          </Tag>
        ),
      },
      {
        title: '进度',
        colKey: 'progress',
        width: 100,
        cell: ({ row }) => `${row.progress}%`,
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
        width: 100,
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
        {/* 工具栏：含批量操作 */}
        <CrudToolbar extraActions={extraActions} batchActions={batchActions} selectedCount={selectedRowKeys.length} />

        {/* 表格：启用多选 */}
        <Table
          loading={loading}
          data={list}
          columns={columns}
          rowKey='id'
          hover
          selectedRowKeys={selectedRowKeys}
          onSelectChange={handleSelectionChange}
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};

export default memo(BatchOperationExample);
