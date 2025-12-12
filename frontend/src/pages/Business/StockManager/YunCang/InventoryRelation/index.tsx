import { CrudToolbar } from 'components/CrudKit';
import { useCrudTable } from 'components/CrudKit/hooks';
import type { ToolbarActionConfig } from 'components/CrudKit/types';
import React, { memo, useCallback, useRef, useState } from 'react';
import api from 'services';
import type {
  ListSharedInventoryPoolDto,
  RemoveSharedInventoryPoolDto,
  SetSharedInventoryPoolDto,
  SharedInventoryPoolEntity,
} from 'services/generated/model';
import { AddIcon, CloseIcon } from 'tdesign-icons-react';
import { Button, Card, Col, Form, Input, MessagePlugin, Popconfirm, Row, Table, Tag } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import SetSharedInventoryPoolModal from '../components/SetSharedInventoryPoolModal';

const { FormItem } = Form;

/**
 * 库存关系管理页面
 */
const InventoryRelation: React.FC = () => {
  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 表格状态
  const {
    list,
    total,
    loading,
    filters,
    refresh,
    handleSearch,
    handleReset,
    handlePageChange,
  } = useCrudTable<SharedInventoryPoolEntity, ListSharedInventoryPoolDto>({
    fetchApi: api.sysStockControllerListSharedInventoryPool,
    defaultFilters: {
      current: 1,
      pageSize: 10,
    },
    defaultPageSize: 10,
  });

  // 设置共用库存池弹窗状态
  const [setSharedPoolVisible, setSetSharedPoolVisible] = useState(false);
  const setSharedPoolFormRef = useRef<FormInstanceFunctions>(null);

  // 打开设置共用库存池弹窗
  const handleOpenSetSharedPool = useCallback(() => {
    setSetSharedPoolVisible(true);
  }, []);

  // 关闭设置共用库存池弹窗
  const handleCloseSetSharedPool = useCallback(() => {
    setSetSharedPoolVisible(false);
    setSharedPoolFormRef.current?.reset?.();
  }, []);

  // 提交设置共用库存池
  const handleSubmitSetSharedPool = useCallback(async () => {
    const formValues = setSharedPoolFormRef.current?.getFieldsValue?.(true) as SetSharedInventoryPoolDto;
    if (!formValues || !formValues.skus || formValues.skus.length < 2) {
      MessagePlugin.warning('至少需要选择2个SKU');
      return;
    }

    try {
      await api.sysStockControllerSetSharedInventoryPool({
        skus: formValues.skus,
      });
      MessagePlugin.success('设置成功');
      handleCloseSetSharedPool();
      refresh();
    } catch (error: any) {
      console.error('设置共用库存池失败:', error);
      MessagePlugin.error(error?.msg || '设置失败');
    }
  }, [handleCloseSetSharedPool, refresh]);

  // 解除共享关系
  const handleRemoveSharedPool = useCallback(
    async (sku: string) => {
      try {
        await api.sysStockControllerRemoveSharedInventoryPool({
          sku,
        } as RemoveSharedInventoryPoolDto);
        MessagePlugin.success('解除共享关系成功');
        refresh();
      } catch (error: any) {
        console.error('解除共享关系失败:', error);
        MessagePlugin.error(error?.msg || '解除失败');
      }
    },
    [refresh],
  );

  // 搜索表单提交
  const handleSearchSubmit = useCallback(() => {
    const formValues = searchFormRef.current?.getFieldsValue?.(true) as Record<string, unknown>;
    const searchParams: Record<string, unknown> = {};

    // 过滤空值
    Object.entries(formValues || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams[key] = value;
      }
    });

    handleSearch(searchParams);
  }, [handleSearch]);

  // 搜索表单重置
  const handleSearchReset = useCallback(() => {
    searchFormRef.current?.reset?.();
    handleReset();
  }, [handleReset]);

  // 工具栏操作
  const toolbarExtraActions: ToolbarActionConfig[] = [
    {
      label: '设置共用库存池',
      icon: <AddIcon />,
      onClick: handleOpenSetSharedPool,
      theme: 'primary',
    },
  ];

  // 表格列定义
  const columns: PrimaryTableCol<SharedInventoryPoolEntity>[] = [
    {
      colKey: 'id',
      title: '库存池ID',
      width: 200,
      ellipsis: true,
    },
    {
      colKey: 'quantity',
      title: '库存数量',
      width: 120,
      align: 'right',
      cell: ({ row }) => <span className='font-semibold text-blue-600'>{row.quantity?.toLocaleString() || 0}</span>,
    },
    {
      colKey: 'skuCount',
      title: '共用SKU数量',
      width: 120,
      align: 'center',
      cell: ({ row }) => (
        <Tag theme='primary' variant='light'>
          {row.skuCount || 0} 个
        </Tag>
      ),
    },
    {
      colKey: 'goods',
      title: '共用商品列表',
      minWidth: 300,
      ellipsis: {
        props: { theme: 'default' },
        content: ({ row }) => (
          <div className='flex flex-wrap gap-2'>
            {row.goods?.map((good: any) => (
              <Tag key={good.goodId} size='small' variant='light'>
                {good.sku}
              </Tag>
            )) || []}
          </div>
        ),
      },
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-2 items-center'>
          {row.goods?.map((good: any) => (
            <div key={good.goodId} className='flex items-center gap-1'>
              <Tag size='small' variant='light' title={`${good.sku} - ${good.departmentName || ''}`}>
                {good.sku}
              </Tag>
              <Popconfirm
                content={`确定要解除 SKU "${good.sku}" 的共享关系吗？解除后该SKU将拥有独立的空库存池。`}
                onConfirm={() => handleRemoveSharedPool(good.sku)}
                placement='top'
              >
                <Button
                  variant='text'
                  theme='danger'
                  size='small'
                  shape='circle'
                  icon={<CloseIcon size='12px' />}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              </Popconfirm>
            </div>
          )) || <span className='text-gray-400'>-</span>}
        </div>
      ),
    },
    {
      colKey: 'createdAt',
      title: '创建时间',
      width: 180,
      cell: ({ row }) => {
        if (!row.createdAt) return <span className='text-gray-400'>-</span>;
        const date = new Date(row.createdAt);
        return date.toLocaleString('zh-CN');
      },
    },
    {
      colKey: 'updatedAt',
      title: '更新时间',
      width: 180,
      cell: ({ row }) => {
        if (!row.updatedAt) return <span className='text-gray-400'>-</span>;
        const date = new Date(row.updatedAt);
        return date.toLocaleString('zh-CN');
      },
    },
  ];

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      <Card bordered={false}>
        <Form ref={searchFormRef} labelWidth={80} colon onSubmit={handleSearchSubmit}>
          <Row gutter={[16, 16]}>
            <Col span={3} xs={12} sm={6} xl={3}>
              <FormItem label='SKU关键词' name='skuKeyword'>
                <Input placeholder='请输入SKU关键词' clearable />
              </FormItem>
            </Col>
            <Col flex='160px'>
              <div className='flex gap-2'>
                <Button theme='primary' type='submit'>
                  搜索
                </Button>
                <Button theme='default' type='reset' onClick={handleSearchReset}>
                  重置
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 表格区域 */}
      <Card bordered={false}>
        {/* 工具栏 */}
        <div className='mb-4'>
          <CrudToolbar extraActions={toolbarExtraActions} />
        </div>

        {/* 表格 */}
        <Table
          loading={loading}
          data={list}
          columns={columns}
          rowKey='id'
          hover
          tableLayout='fixed'
          horizontalScrollAffixedBottom
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* 设置共用库存池弹窗 */}
      <SetSharedInventoryPoolModal
        visible={setSharedPoolVisible}
        formRef={setSharedPoolFormRef}
        onClose={handleCloseSetSharedPool}
        onSubmit={handleSubmitSetSharedPool}
      />
    </div>
  );
};

export default memo(InventoryRelation);
