import { CrudToolbar } from 'components/CrudKit';
import { useCrudTable } from 'components/CrudKit/hooks';
import type { ToolbarActionConfig } from 'components/CrudKit/types';
import DeptTreeSelect, { useDeptTree } from 'components/DeptTreeSelect';
import { useDownloadNotify } from 'components/DownloadNotifyModal';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from 'services';
import type {
  PurchaseDetailEntity,
  PurchaseOrderConfirmDto,
  PurchaseOrderCreateDto,
  PurchaseOrderEntity,
  PurchaseOrderQueryDto,
  PurchaseOrderUpdateDto,
} from 'services/generated/model';
import { DownloadIcon, PlusIcon } from 'tdesign-icons-react';
import {
  Button,
  Card,
  Col,
  DateRangePicker,
  Dialog,
  Form,
  Image,
  ImageViewer,
  Input,
  InputNumber,
  MessagePlugin,
  Row,
  Select,
  Table,
  Tag,
} from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

const { FormItem } = Form;

/**
 * 图片展示组件
 * 支持点击放大预览
 */
const ImageCell: React.FC<{ url?: string | null }> = memo(({ url }) => {
  const [viewerVisible, setViewerVisible] = useState(false);

  if (!url) return <span className='text-gray-400'>-</span>;

  return (
    <>
      <Image
        src={url}
        style={{ width: 40, height: 40 }}
        fit='cover'
        shape='round'
        loading='lazy'
        error='加载失败'
        onClick={() => setViewerVisible(true)}
        className='cursor-pointer'
      />
      <ImageViewer visible={viewerVisible} images={[url]} onClose={() => setViewerVisible(false)} />
    </>
  );
});

/**
 * 采购详情表格列
 */
const purchaseDetailColumns: PrimaryTableCol<PurchaseDetailEntity>[] = [
  {
    title: '部门',
    colKey: 'departmentName',
    width: 120,
    ellipsis: true,
    cell: ({ row }) => row.departmentName || <span className='text-gray-400'>-</span>,
  },
  {
    title: '负责人',
    colKey: 'responsiblePerson',
    width: 120,
    ellipsis: true,
    cell: ({ row }) => row.responsiblePerson || <span className='text-gray-400'>-</span>,
  },
  {
    title: '货号',
    colKey: 'shelfNumber',
    width: 120,
    ellipsis: true,
    cell: ({ row }) => row.shelfNumber || <span className='text-gray-400'>-</span>,
  },
  {
    title: 'SKU',
    colKey: 'sku',
    width: 120,
    ellipsis: true,
    cell: ({ row }) => (
      <Tag size='small' variant='light'>
        {row.sku}
      </Tag>
    ),
  },
  {
    title: '产品规格',
    colKey: 'spec',
    width: 150,
    ellipsis: true,
    cell: ({ row }) => row.spec || <span className='text-gray-400'>-</span>,
  },
  {
    title: '产品图片',
    colKey: 'imageUrl',
    width: 100,
    cell: ({ row }) => <ImageCell url={row.imageUrl} />,
  },
  {
    title: '采购数量',
    colKey: 'quantity',
    width: 120,
    align: 'right',
  },
  {
    title: '采购金额',
    colKey: 'purchaseAmount',
    width: 120,
    align: 'right',
    cell: ({ row }) => `¥${row.purchaseAmount.toFixed(2)}`,
  },
  {
    title: '采购订单号',
    colKey: 'purchaseOrderNumber',
    width: 150,
    ellipsis: true,
    cell: ({ row }) => row.purchaseOrderNumber || <span className='text-gray-400'>-</span>,
  },
  {
    title: '快递单号',
    colKey: 'expressNo',
    width: 150,
    ellipsis: true,
    cell: ({ row }) => row.expressNo || <span className='text-gray-400'>-</span>,
  },
];

/**
 * 采购订单详情弹窗
 */
interface PurchaseOrderDetailModalProps {
  visible: boolean;
  order: PurchaseOrderEntity | null;
  onClose: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ visible, order, onClose }) => {
  if (!order) return null;

  return (
    <Dialog header='采购订单详情' visible={visible} onClose={onClose} onConfirm={onClose} width={1000}>
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <span className='text-sm text-gray-500'>采购批次号：</span>
            <span>{order.purchaseBatchNumber}</span>
          </div>
          <div>
            <span className='text-sm text-gray-500'>创建时间：</span>
            <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <div>
            <span className='text-sm text-gray-500'>部门确认状态：</span>
            <Tag theme={order.departmentConfirmStatus ? 'success' : 'warning'}>
              {order.departmentConfirmStatus ? '已确认' : '未确认'}
            </Tag>
          </div>
          <div>
            <span className='text-sm text-gray-500'>财务确认状态：</span>
            <Tag theme={order.financeConfirmStatus ? 'success' : 'warning'}>
              {order.financeConfirmStatus ? '已确认' : '未确认'}
            </Tag>
          </div>
        </div>

        <div>
          <div className='mb-2 text-sm text-gray-500'>采购详情：</div>
          <Table
            data={order.purchaseDetails || []}
            columns={purchaseDetailColumns}
            rowKey='id'
            size='small'
            hover
            tableLayout='fixed'
            horizontalScrollAffixedBottom
          />
        </div>
      </div>
    </Dialog>
  );
};

/**
 * 创建/编辑采购订单弹窗
 */
interface PurchaseOrderFormModalProps {
  visible: boolean;
  order: PurchaseOrderEntity | null;
  isEdit: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  visible,
  order,
  isEdit,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<
    Array<{
      sku: string;
      quantity: number;
      purchaseAmount: number;
      purchaseOrderNumber?: string;
      expressNo?: string;
    }>
  >([]);

  // 重置表单
  useEffect(() => {
    if (visible) {
      if (isEdit && order) {
        form?.setFieldsValue({
          purchaseBatchNumber: order.purchaseBatchNumber,
        });
        setDetails(
          order.purchaseDetails?.map((detail) => ({
            sku: detail.sku,
            quantity: detail.quantity,
            purchaseAmount: Number(detail.purchaseAmount),
            purchaseOrderNumber: detail.purchaseOrderNumber || '',
            expressNo: detail.expressNo || '',
          })) || [],
        );
      } else {
        form?.reset?.();
        setDetails([]);
      }
    }
  }, [visible, isEdit, order, form]);

  // 添加采购详情
  const handleAddDetail = useCallback(() => {
    setDetails((prev) => [
      ...prev,
      {
        sku: '',
        quantity: 1,
        purchaseAmount: 0,
        purchaseOrderNumber: '',
        expressNo: '',
      },
    ]);
  }, []);

  // 删除采购详情
  const handleDeleteDetail = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 更新采购详情
  const handleUpdateDetail = useCallback((index: number, field: string, value: any) => {
    setDetails((prev) => prev.map((detail, i) => (i === index ? { ...detail, [field]: value } : detail)));
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    const formValues = form?.getFieldsValue?.(true) as { purchaseBatchNumber: string };
    if (!formValues?.purchaseBatchNumber || details.length === 0) {
      MessagePlugin.error('请填写完整信息');
      return;
    }

    // 验证采购详情
    for (const detail of details) {
      if (!detail.sku || detail.quantity <= 0 || detail.purchaseAmount < 0) {
        MessagePlugin.error('采购详情信息不完整');
        return;
      }
    }

    const submitData = {
      purchaseBatchNumber: formValues.purchaseBatchNumber,
      purchaseDetails: details,
    };

    setLoading(true);
    try {
      if (isEdit && order) {
        await api.sysStockControllerUpdatePurchaseOrder({
          id: order.id,
          ...submitData,
        } as unknown as PurchaseOrderUpdateDto);
      } else {
        await api.sysStockControllerCreatePurchaseOrder(submitData as unknown as PurchaseOrderCreateDto);
      }
      MessagePlugin.success(isEdit ? '更新成功' : '创建成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(isEdit ? '更新采购订单失败:' : '创建采购订单失败:', error);
      MessagePlugin.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  }, [details, form, isEdit, order, onSuccess, onClose]);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    form?.reset?.();
    setDetails([]);
    onClose();
  }, [form, onClose]);

  return (
    <Dialog
      header={isEdit ? '编辑采购订单' : '创建采购订单'}
      visible={visible}
      onClose={handleClose}
      width={1000}
      footer={
        <>
          <Button variant='base' theme='default' onClick={handleClose}>
            取消
          </Button>
          <Button theme='primary' loading={loading} onClick={handleSubmit}>
            {isEdit ? '更新' : '创建'}
          </Button>
        </>
      }
    >
      <Form form={form} labelWidth={100} colon>
        <Row>
          <Col span={12}>
            <FormItem
              label='采购批次号'
              name='purchaseBatchNumber'
              rules={[{ required: true, message: '请输入采购批次号' }]}
            >
              <Input
                placeholder='请输入采购批次号'
                suffix={
                  <Button
                    type='button'
                    theme='primary'
                    variant='base'
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      const timestamp = Date.now();
                      const random = Math.floor(Math.random() * 10000)
                        .toString()
                        .padStart(4, '0');
                      const batchNumber = `${timestamp}${random}`;
                      form.setFieldsValue({ purchaseBatchNumber: batchNumber });
                    }}
                  >
                    生成批次号
                  </Button>
                }
              />
            </FormItem>
          </Col>
        </Row>

        <div className='mb-4 mt-6'>
          {details.map((detail, index) => (
            <Card key={index} className='mb-3' size='small'>
              <div className='grid grid-cols-6 gap-4 items-end'>
                <div className='col-span-1'>
                  <span className='text-xs text-gray-500 mb-1 block'>SKU</span>
                  <Input
                    value={detail.sku}
                    onChange={(value) => handleUpdateDetail(index, 'sku', value)}
                    placeholder='请输入SKU'
                    size='small'
                  />
                </div>
                <div className='col-span-1'>
                  <span className='text-xs text-gray-500 mb-1 block'>采购数量</span>
                  <InputNumber
                    value={detail.quantity}
                    onChange={(value) => handleUpdateDetail(index, 'quantity', value)}
                    min={1}
                    size='small'
                  />
                </div>
                <div className='col-span-1'>
                  <span className='text-xs text-gray-500 mb-1 block'>采购金额</span>
                  <InputNumber
                    value={detail.purchaseAmount}
                    onChange={(value) => handleUpdateDetail(index, 'purchaseAmount', value)}
                    min={0}
                    decimalPlaces={2}
                    size='small'
                  />
                </div>
                <div className='col-span-1'>
                  <span className='text-xs text-gray-500 mb-1 block'>采购订单号</span>
                  <Input
                    value={detail.purchaseOrderNumber}
                    onChange={(value) => handleUpdateDetail(index, 'purchaseOrderNumber', value)}
                    placeholder='采购订单号'
                    size='small'
                  />
                </div>
                <div className='col-span-1'>
                  <span className='text-xs text-gray-500 mb-1 block'>快递单号</span>
                  <Input
                    value={detail.expressNo}
                    onChange={(value) => handleUpdateDetail(index, 'expressNo', value)}
                    placeholder='快递单号'
                    size='small'
                  />
                </div>
                <div className='col-span-1'>
                  <Button theme='danger' size='small' variant='outline' onClick={() => handleDeleteDetail(index)}>
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {details.length === 0 && <div className='text-center py-8 text-gray-400'>请添加采购商品</div>}

          <div className='grid grid-cols-6 gap-4 mt-4'>
            <div className='col-span-6'>
              <Button theme='primary' size='small' icon={<PlusIcon />} onClick={handleAddDetail}>
                添加商品
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </Dialog>
  );
};

/**
 * 采购订单管理页面
 */
const PurchaseOrderManager: React.FC = () => {
  // 部门筛选权限
  const { isLeader, deptTreeData, userDeptId, loading: deptLoading } = useDeptTree();

  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 导出功能
  const { startDownload, DownloadModal } = useDownloadNotify();

  // 弹窗状态
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrderEntity | null>(null);

  // 展开的行 keys
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>([]);

  // 表格数据管理
  const {
    list,
    total,
    loading: tableLoading,
    filters,
    refresh,
    handleSearch,
    handleReset,
    handlePageChange,
  } = useCrudTable<PurchaseOrderEntity, PurchaseOrderQueryDto>({
    fetchApi: api.sysStockControllerListPurchaseOrder as any,
    defaultFilters: {},
    defaultPageSize: 10,
  });

  // 导出采购订单
  const handleExport = useCallback(() => {
    // 获取当前筛选条件（排除分页参数）
    const exportQuery: PurchaseOrderQueryDto = {
      ...filters,
      current: 1,
      pageSize: 10000, // 导出时获取所有数据
    };

    startDownload({
      downloadFn: async () => {
        const response = await api.sysStockControllerExportPurchaseOrder(exportQuery);
        if (response instanceof Blob) {
          return response;
        }
        throw new Error('导出失败：响应格式不正确');
      },
      defaultFileName: `采购订单_${new Date().toISOString().split('T')[0]}.xlsx`,
      downloadText: '正在导出采购订单，请稍候...',
      saveText: '导出完成，请点击保存按钮保存文件',
    });
  }, [filters, startDownload]);

  // 打开创建弹窗
  const handleOpenCreate = useCallback(() => {
    setCreateVisible(true);
  }, []);

  // 打开编辑弹窗
  const handleOpenEdit = useCallback((order: PurchaseOrderEntity) => {
    if (order.departmentConfirmStatus) {
      MessagePlugin.warning('已部门确认的订单不能编辑');
      return;
    }
    setCurrentOrder(order);
    setEditVisible(true);
  }, []);

  // 打开详情弹窗
  const handleOpenDetail = useCallback((order: PurchaseOrderEntity) => {
    setCurrentOrder(order);
    setDetailVisible(true);
  }, []);

  // 关闭弹窗
  const handleCloseModal = useCallback(() => {
    setCreateVisible(false);
    setEditVisible(false);
    setDetailVisible(false);
    setCurrentOrder(null);
  }, []);

  // 操作成功回调
  const handleSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  // 部门确认
  const handleConfirmByDepartment = useCallback(
    async (order: PurchaseOrderEntity) => {
      try {
        await api.sysStockControllerConfirmPurchaseOrderByDepartment({
          id: order.id,
        } as PurchaseOrderConfirmDto);
        MessagePlugin.success('部门确认成功');
        refresh();
      } catch (error) {
        console.error('部门确认失败:', error);
        MessagePlugin.error('部门确认失败');
      }
    },
    [refresh],
  );

  // 财务确认
  const handleConfirmByFinance = useCallback(
    async (order: PurchaseOrderEntity) => {
      try {
        await api.sysStockControllerConfirmPurchaseOrderByFinance({
          id: order.id,
        } as PurchaseOrderConfirmDto);
        MessagePlugin.success('财务确认成功');
        refresh();
      } catch (error) {
        console.error('财务确认失败:', error);
        MessagePlugin.error('财务确认失败');
      }
    },
    [refresh],
  );

  // 展开行变化处理
  const handleExpandChange = useCallback((keys: (string | number)[]) => {
    setExpandedRowKeys(keys);
  }, []);

  // 行展开渲染
  const expandedRowRender = useCallback(({ row }: { row: PurchaseOrderEntity }) => {
    if (!row.purchaseDetails || row.purchaseDetails.length === 0) {
      return <div className='p-4 text-gray-400'>暂无采购详情</div>;
    }

    return (
      <Table
        data={row.purchaseDetails}
        columns={purchaseDetailColumns}
        rowKey='id'
        size='small'
        hover
        tableLayout='fixed'
        horizontalScrollAffixedBottom
      />
    );
  }, []);

  // 搜索表单提交
  const handleSearchSubmit = useCallback(() => {
    const formValues = searchFormRef.current?.getFieldsValue?.(true) as Record<string, unknown>;
    const searchParams: Record<string, unknown> = {};

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

  // 工具栏额外按钮
  const toolbarExtraActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        key: 'create',
        label: '创建采购订单',
        icon: <PlusIcon />,
        onClick: handleOpenCreate,
      },
      {
        key: 'export',
        label: '导出采购订单',
        icon: <DownloadIcon />,
        onClick: handleExport,
      },
    ],
    [handleOpenCreate, handleExport],
  );

  // 表格列配置
  const columns = useMemo<PrimaryTableCol<PurchaseOrderEntity>[]>(() => {
    return [
      {
        title: '采购批次号',
        colKey: 'purchaseBatchNumber',
        width: 150,
        ellipsis: true,
      },
      {
        title: '采购商品数量',
        colKey: 'purchaseDetails',
        width: 120,
        align: 'right',
        cell: ({ row }) => row.purchaseDetails?.length || 0,
      },
      {
        title: '总采购金额',
        colKey: 'totalAmount',
        width: 120,
        align: 'right',
        cell: ({ row }) => {
          const total = row.purchaseDetails?.reduce((sum, detail) => sum + Number(detail.purchaseAmount), 0) || 0;
          return `¥${total.toFixed(2)}`;
        },
      },
      {
        title: '创建时间',
        colKey: 'createdAt',
        width: 180,
        cell: ({ row }) => new Date(row.createdAt).toLocaleString('zh-CN'),
      },
      {
        title: '部门确认状态',
        colKey: 'departmentConfirmStatus',
        width: 120,
        cell: ({ row }) => (
          <Tag theme={row.departmentConfirmStatus ? 'success' : 'warning'}>
            {row.departmentConfirmStatus ? '已确认' : '未确认'}
          </Tag>
        ),
      },
      {
        title: '财务确认状态',
        colKey: 'financeConfirmStatus',
        width: 120,
        cell: ({ row }) => (
          <Tag theme={row.financeConfirmStatus ? 'success' : 'warning'}>
            {row.financeConfirmStatus ? '已确认' : '未确认'}
          </Tag>
        ),
      },
      {
        title: '操作',
        colKey: 'operation',
        fixed: 'right',
        width: 280,
        cell: ({ row }) => (
          <div className='space-x-2'>
            <Button variant='text' theme='primary' size='small' onClick={() => handleOpenDetail(row)}>
              查看
            </Button>
            {!row.departmentConfirmStatus && (
              <Button variant='text' theme='warning' size='small' onClick={() => handleOpenEdit(row)}>
                采购编辑
              </Button>
            )}
            {!row.departmentConfirmStatus && (
              <Button variant='text' theme='success' size='small' onClick={() => handleConfirmByDepartment(row)}>
                部门确认
              </Button>
            )}
            {row.departmentConfirmStatus && !row.financeConfirmStatus && (
              <Button variant='text' theme='success' size='small' onClick={() => handleConfirmByFinance(row)}>
                财务确认
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [handleOpenDetail, handleOpenEdit, handleConfirmByDepartment, handleConfirmByFinance]);

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      <Card bordered={false}>
        <Form ref={searchFormRef} labelWidth={80} colon>
          <Row>
            <Col flex='1'>
              <Row gutter={[16, 16]}>
                {/* 部门筛选（负责人可见） */}
                {isLeader && (
                  <Col span={3} xs={12} sm={6} xl={3}>
                    <FormItem label='部门' name='departmentId'>
                      <DeptTreeSelect deptTreeData={deptTreeData} treeProps={{ checkStrictly: true }} />
                    </FormItem>
                  </Col>
                )}
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='采购批次号' name='purchaseBatchNumber'>
                    <Input placeholder='请输入采购批次号' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='部门验收' name='departmentConfirmStatus'>
                    <Select
                      placeholder='请选择'
                      clearable
                      options={[
                        { label: '已确认', value: true },
                        { label: '未确认', value: false },
                      ]}
                    />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='财务确认' name='financeConfirmStatus'>
                    <Select
                      placeholder='请选择'
                      clearable
                      options={[
                        { label: '已确认', value: true },
                        { label: '未确认', value: false },
                      ]}
                    />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='创建时间' name='createdAtRange'>
                    <DateRangePicker placeholder={['开始日期', '结束日期']} format='YYYY-MM-DD' />
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
        <CrudToolbar extraActions={toolbarExtraActions} />

        <Table
          loading={tableLoading || deptLoading}
          data={list}
          columns={columns}
          rowKey='id'
          hover
          tableLayout='fixed'
          horizontalScrollAffixedBottom
          expandedRowKeys={expandedRowKeys}
          onExpandChange={handleExpandChange}
          expandedRow={expandedRowRender}
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* 创建采购订单弹窗 */}
      <PurchaseOrderFormModal
        visible={createVisible}
        order={null}
        isEdit={false}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* 编辑采购订单弹窗 */}
      <PurchaseOrderFormModal
        visible={editVisible}
        order={currentOrder}
        isEdit={true}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* 采购订单详情弹窗 */}
      <PurchaseOrderDetailModal visible={detailVisible} order={currentOrder} onClose={handleCloseModal} />

      {/* 导出下载弹窗 */}
      <DownloadModal />
    </div>
  );
};

export default memo(PurchaseOrderManager);
