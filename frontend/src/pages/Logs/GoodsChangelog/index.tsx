/**
 * 商品信息变动日志查询页面
 * 仅查询展示，无增删改功能
 */
import { CrudToolbar, useCrudTable } from 'components/CrudKit';
import DeptTreeSelect, { useDeptTree } from 'components/DeptTreeSelect';
import dayjs from 'dayjs';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import api from 'services';
import type { ChangeLogEntity, ChangeLogQueryDto } from 'services/generated/model';
import { DownloadIcon } from 'tdesign-icons-react';
import { Button, Card, Col, DateRangePicker, Form, Input, MessagePlugin, Row, Table } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

const { FormItem } = Form;

// ============ 表格列配置 ============
const columns: PrimaryTableCol<ChangeLogEntity>[] = [
  { title: '部门名称', colKey: 'good.departmentName', width: 200, ellipsis: true },
  {
    title: '店铺名称',
    colKey: 'good.shopName',
    width: 200,
    ellipsis: true,
    cell: ({ row }) => row.good?.shopName || '-',
  },
  {
    title: 'SKU',
    colKey: 'good.sku',
    width: 180,
    ellipsis: true,
  },
  {
    title: '货架号',
    colKey: 'good.shelfNumber',
    width: 200,
    cell: ({ row }) => row.good?.shelfNumber || '-',
  },
  { title: '操作人', colKey: 'username', width: 120 },
  {
    title: '操作内容',
    colKey: 'content',
    minWidth: 300,
    ellipsis: true,
  },
  {
    title: '操作时间',
    colKey: 'createdAt',
    width: 180,
    cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
];

// ============ 页面组件 ============
const GoodsChangelog: React.FC = () => {
  // 部门树数据
  const { deptTreeData, loading: deptLoading } = useDeptTree();

  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 使用表格 Hook
  const { list, total, loading, filters, handleSearch, handleReset, handlePageChange } = useCrudTable<
    ChangeLogEntity,
    ChangeLogQueryDto
  >({
    fetchApi: api.sysGoodsControllerGetChangeLogs,
    defaultPageSize: 10,
  });

  // 搜索表单提交
  const handleSearchSubmit = useCallback(() => {
    const formValues = searchFormRef.current?.getFieldsValue?.(true) as Record<string, unknown>;
    const searchParams: Record<string, unknown> = {};

    // 过滤空值并转换日期范围
    Object.entries(formValues || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'dateRange' && Array.isArray(value) && value.length === 2) {
          searchParams.startTime = value[0];
          searchParams.endTime = value[1];
        } else {
          searchParams[key] = value;
        }
      }
    });

    handleSearch(searchParams);
  }, [handleSearch]);

  // 搜索表单重置
  const handleSearchReset = useCallback(() => {
    searchFormRef.current?.reset?.();
    handleReset();
  }, [handleReset]);

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
        <Form ref={searchFormRef} labelWidth={80} colon>
          <Row>
            <Col flex='1'>
              <Row gutter={[16, 16]}>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='部门' name='departmentId'>
                    <DeptTreeSelect deptTreeData={deptTreeData} />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='操作人' name='username'>
                    <Input placeholder='请输入操作人用户名' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='商品ID' name='goodId'>
                    <Input placeholder='请输入商品ID' />
                  </FormItem>
                </Col>
                <Col span={4} xs={12} sm={8} xl={4}>
                  <FormItem label='操作时间' name='dateRange'>
                    <DateRangePicker enableTimePicker allowInput clearable style={{ width: '100%' }} />
                  </FormItem>
                </Col>
              </Row>
            </Col>
            <Col flex='160px'>
              <Button theme='primary' className='ml-4' onClick={handleSearchSubmit}>
                查询
              </Button>
              <Button variant='base' theme='default' className='ml-2' onClick={handleSearchReset}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 表格区域 */}
      <Card bordered={false}>
        {/* 工具栏（无主按钮，只有导出） */}
        <CrudToolbar extraActions={extraActions} />

        {/* 表格 */}
        <Table
          loading={loading || deptLoading}
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

export default memo(GoodsChangelog);
