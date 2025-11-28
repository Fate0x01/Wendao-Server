/**
 * 示例：仅查询页面（含导出功能）
 * 适用场景：只需查询展示、支持导出，无增删改功能
 * 使用方式：复制此文件到 src/pages/YourModule/ 目录，按需修改
 */
import { CrudSearchForm, CrudToolbar, useCrudTable, type SearchFieldConfig } from 'components/CrudKit';
import dayjs from 'dayjs';
import React, { memo, useMemo } from 'react';
import { DownloadIcon } from 'tdesign-icons-react';
import { Card, MessagePlugin, Table } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
// TODO: 替换为实际的 API 和类型
// import api from 'services';
// import type { XxxEntity, XxxQueryDto } from 'services/generated/model';

// ============ 类型定义（TODO: 替换为实际类型） ============
interface LogEntity {
  id: string;
  action: string;
  operator: string;
  ip: string;
  createdAt: string;
}

interface LogQueryDto {
  current: number;
  pageSize: number;
  keywords?: string;
  startDate?: string;
  endDate?: string;
}

// ============ 模拟 API（TODO: 替换为实际 API） ============
const mockApi = {
  getList: async (params: LogQueryDto) => ({
    data: {
      list: [
        { id: '1', action: '用户登录', operator: 'admin', ip: '192.168.1.1', createdAt: new Date().toISOString() },
        { id: '2', action: '创建角色', operator: 'admin', ip: '192.168.1.1', createdAt: new Date().toISOString() },
      ],
      total: 2,
    },
  }),
};

// ============ 搜索字段配置 ============
const searchFields: SearchFieldConfig[] = [
  { name: 'keywords', label: '关键词', type: 'input', placeholder: '请输入操作/操作人' },
  {
    name: 'dateRange',
    label: '时间范围',
    type: 'dateRange',
    span: 4,
    // 日期范围转换为 startDate 和 endDate
    transform: (value) => {
      if (Array.isArray(value) && value.length === 2) {
        return { startDate: value[0], endDate: value[1] };
      }
      return {};
    },
  },
];

// ============ 表格列配置 ============
const columns: PrimaryTableCol<LogEntity>[] = [
  { title: '操作', colKey: 'action', width: 200 },
  { title: '操作人', colKey: 'operator', width: 120 },
  { title: 'IP 地址', colKey: 'ip', width: 150 },
  {
    title: '操作时间',
    colKey: 'createdAt',
    width: 180,
    cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
];

// ============ 页面组件 ============
const QueryOnlyExample: React.FC = () => {
  // 使用表格 Hook
  const { list, total, loading, filters, handleSearch, handleReset, handlePageChange } = useCrudTable<
    LogEntity,
    LogQueryDto
  >({
    fetchApi: mockApi.getList,
    defaultPageSize: 10,
  });

  // 导出处理
  const handleExport = () => {
    // TODO: 实现导出逻辑
    MessagePlugin.info('导出功能开发中...');
  };

  // 工具栏额外按钮
  const extraActions = useMemo(
    () => [{ key: 'export', label: '导出', icon: <DownloadIcon />, onClick: handleExport }],
    [],
  );

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      <Card bordered={false}>
        <CrudSearchForm fields={searchFields} onSearch={handleSearch} onReset={handleReset} />
      </Card>

      {/* 表格区域 */}
      <Card bordered={false}>
        {/* 工具栏（无主按钮，只有导出） */}
        <CrudToolbar extraActions={extraActions} />

        {/* 表格 */}
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
    </div>
  );
};

export default memo(QueryOnlyExample);
