import { fileOpen } from 'browser-fs-access';
import { CrudToolbar } from 'components/CrudKit';
import { useCrudTable } from 'components/CrudKit/hooks';
import type { ToolbarActionConfig } from 'components/CrudKit/types';
import DeptTreeSelect, { useDeptTree } from 'components/DeptTreeSelect';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from 'services';
import type {
  JingCangStockGroupEntity,
  JingCangStockInfoEntity,
  JingCangStockQueryDto,
  SetReorderThresholdDto,
  StockImportResultEntity,
} from 'services/generated/model';
import { DownloadIcon, UploadIcon } from 'tdesign-icons-react';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  ImageViewer,
  Input,
  MessagePlugin,
  Row,
  Select,
  Switch,
  Table,
  Tag,
} from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import ImportResultModal from './components/ImportResultModal';
import ReorderThresholdModal from './components/ReorderThresholdModal';

const { FormItem } = Form;

/**
 * SKU 展示组件
 */
const SkuCell: React.FC<{ sku: string }> = memo(({ sku }) => {
  if (!sku) return <span className='text-gray-400'>-</span>;

  return (
    <Tag size='small' variant='light'>
      {sku}
    </Tag>
  );
});

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
 * 京仓库房管理页面
 */
const JingCangStockManager: React.FC = () => {
  // 部门筛选权限
  const { isLeader, deptTreeData, userDeptId, loading: deptLoading } = useDeptTree();

  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 导入结果弹窗状态
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [importResult, setImportResult] = useState<StockImportResultEntity | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importEmgSkuMappingLoading, setImportEmgSkuMappingLoading] = useState(false);

  // 补货预警阈值弹窗状态
  const [reorderThresholdVisible, setReorderThresholdVisible] = useState(false);
  const [currentStockInfo, setCurrentStockInfo] = useState<JingCangStockInfoEntity | null>(null);
  const reorderThresholdFormRef = useRef<FormInstanceFunctions>(null);

  // 展开的行 keys
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>([]);

  // 是否自动展开所有行
  const [autoExpand, setAutoExpand] = useState(false);

  // 默认筛选条件（普通成员自动注入部门ID）
  const defaultFilters = useMemo(() => {
    if (!isLeader && userDeptId) {
      return { departmentId: userDeptId };
    }
    return {};
  }, [isLeader, userDeptId]);

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
  } = useCrudTable<JingCangStockGroupEntity, JingCangStockQueryDto>({
    fetchApi: api.sysStockControllerListJingCangStock,
    defaultFilters,
    defaultPageSize: 10,
  });

  // 下载模板
  const handleDownloadTemplate = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/template/商品信息导入模板.xlsx';
    link.download = '京仓库存信息导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // 导入 EMG/SKU 映射
  const handleImportEmgSkuMapping = useCallback(async () => {
    try {
      const file = await fileOpen({
        mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        extensions: ['.xlsx', '.xls'],
        description: '选择 EMG/SKU 映射导入文件',
      });

      setImportEmgSkuMappingLoading(true);
      const res = await api.sysGoodsControllerImportEmgSkuMapping({ file });

      if (res.data) {
        setImportResult(res.data);
        setImportResultVisible(true);
        // 导入成功后刷新列表
        if (res.data.success > 0) {
          refresh();
        }
      }
    } catch (error) {
      // 用户取消选择文件时不报错
      if ((error as Error).name !== 'AbortError') {
        console.error('导入 EMG/SKU 映射失败:', error);
        MessagePlugin.error('导入失败');
      }
    } finally {
      setImportEmgSkuMappingLoading(false);
    }
  }, [refresh]);

  // 导入京仓库存信息
  const handleImport = useCallback(async () => {
    try {
      const file = await fileOpen({
        mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        extensions: ['.xlsx', '.xls'],
        description: '选择京仓库存信息导入文件',
      });

      setImportLoading(true);
      const res = await api.sysStockControllerImportJingCangStock({ file });

      if (res.data) {
        setImportResult(res.data);
        setImportResultVisible(true);
        // 导入成功后刷新列表
        if (res.data.success > 0) {
          refresh();
        }
      }
    } catch (error) {
      // 用户取消选择文件时不报错
      if ((error as Error).name !== 'AbortError') {
        console.error('导入京仓库存信息失败:', error);
        MessagePlugin.error('导入失败');
      }
    } finally {
      setImportLoading(false);
    }
  }, [refresh]);

  // 关闭导入结果弹窗
  const handleCloseImportResult = useCallback(() => {
    setImportResultVisible(false);
    setImportResult(null);
  }, []);

  // 打开设置补货预警阈值弹窗
  const handleOpenReorderThreshold = useCallback((stockInfo: JingCangStockInfoEntity) => {
    setCurrentStockInfo(stockInfo);
    setReorderThresholdVisible(true);
  }, []);

  // 关闭设置补货预警阈值弹窗
  const handleCloseReorderThreshold = useCallback(() => {
    setReorderThresholdVisible(false);
    setCurrentStockInfo(null);
    reorderThresholdFormRef.current?.reset?.();
  }, []);

  // 提交设置补货预警阈值
  const handleSubmitReorderThreshold = useCallback(async () => {
    const formValues = reorderThresholdFormRef.current?.getFieldsValue?.(true) as SetReorderThresholdDto;
    if (!formValues || !currentStockInfo) return;

    try {
      await api.sysStockControllerSetReorderThreshold({
        id: currentStockInfo.id,
        reorderThreshold: formValues.reorderThreshold,
      });
      MessagePlugin.success('设置成功');
      handleCloseReorderThreshold();
      refresh();
    } catch (error) {
      console.error('设置补货预警阈值失败:', error);
      MessagePlugin.error('设置失败');
    }
  }, [currentStockInfo, handleCloseReorderThreshold, refresh]);

  // 搜索表单提交
  const handleSearchSubmit = useCallback(() => {
    const formValues = searchFormRef.current?.getFieldsValue?.(true) as Record<string, unknown>;
    const searchParams: Record<string, unknown> = {};

    // 过滤空值
    Object.entries(formValues || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // isLowStock 需要保持布尔值类型
        if (key === 'isLowStock') {
          searchParams[key] = value === true || value === 'true';
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

  // 展开行变化处理
  const handleExpandChange = useCallback((keys: (string | number)[]) => {
    setExpandedRowKeys(keys);
  }, []);

  // 自动展开所有行
  useEffect(() => {
    if (autoExpand && list.length > 0) {
      const allRowKeys = list.map((row) => row.goodId).filter((id) => id !== undefined && id !== null);
      setExpandedRowKeys(allRowKeys);
    }
  }, [autoExpand, list]);

  // 工具栏额外按钮
  const toolbarExtraActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        key: 'download',
        label: '下载模板',
        icon: <DownloadIcon />,
        onClick: handleDownloadTemplate,
      },
      {
        key: 'import-emg-sku-mapping',
        label: '导入 EMG/SKU 映射',
        icon: <UploadIcon />,
        onClick: handleImportEmgSkuMapping,
        disabled: importEmgSkuMappingLoading,
      },
      {
        key: 'import',
        label: '导入库存信息',
        icon: <UploadIcon />,
        onClick: handleImport,
        disabled: importLoading,
      },
    ],
    [handleDownloadTemplate, handleImportEmgSkuMapping, importEmgSkuMappingLoading, handleImport, importLoading],
  );

  // 构建表格列配置
  const columns = useMemo<PrimaryTableCol<JingCangStockGroupEntity>[]>(() => {
    return [
      {
        title: '部门',
        colKey: 'departmentName',
        width: 120,
        ellipsis: true,
      },
      {
        title: '店铺名称',
        colKey: 'shopName',
        width: 150,
        ellipsis: true,
        cell: ({ row }) => row.shopName || <span className='text-gray-400'>-</span>,
      },
      {
        title: 'SKU',
        colKey: 'sku',
        width: 150,
        cell: ({ row }) => <SkuCell sku={row.sku} />,
      },
      {
        title: '货号',
        colKey: 'shelfNumber',
        width: 120,
        ellipsis: true,
        cell: ({ row }) => row.shelfNumber || <span className='text-gray-400'>-</span>,
      },
      {
        title: '产品图片',
        colKey: 'imageUrl',
        width: 100,
        cell: ({ row }) => <ImageCell url={row.imageUrl} />,
      },
      {
        title: '入仓条码',
        colKey: 'inboundBarcode',
        width: 150,
        ellipsis: true,
        cell: ({ row }) => row.inboundBarcode || <span className='text-gray-400'>-</span>,
      },
      {
        title: '产品规格',
        colKey: 'spec',
        width: 150,
        ellipsis: true,
        cell: ({ row }) => row.spec || <span className='text-gray-400'>-</span>,
      },
      {
        title: '总库存数量',
        colKey: 'totalStockQuantity',
        width: 120,
        align: 'right',
      },
      {
        title: '总日销量',
        colKey: 'totalDailySalesQuantity',
        width: 120,
        align: 'right',
      },
      {
        title: '总月销量',
        colKey: 'totalMonthlySalesQuantity',
        width: 120,
        align: 'right',
      },
      {
        title: '进货成本总货值',
        colKey: 'totalPurchaseCostValue',
        width: 150,
        align: 'right',
        cell: ({ row }) => {
          if (row.totalPurchaseCostValue === null || row.totalPurchaseCostValue === undefined) {
            return <span className='text-gray-400'>-</span>;
          }
          return <span>¥{row.totalPurchaseCostValue.toFixed(2)}</span>;
        },
      },
    ];
  }, []);

  // 展开行内容渲染
  const expandedRowRender = useCallback(
    ({ row }: { row: JingCangStockGroupEntity }) => {
      if (!row.stockInfos || row.stockInfos.length === 0) {
        return <div className='p-4 text-gray-400'>暂无库存信息</div>;
      }

      const stockColumns: PrimaryTableCol<JingCangStockInfoEntity & { purchaseCost?: number | null }>[] = [
        {
          title: '所属库房',
          colKey: 'warehouse',
          width: 120,
        },
        {
          title: '库存数量',
          colKey: 'stockQuantity',
          width: 120,
          align: 'right',
        },
        {
          title: '日销量',
          colKey: 'dailySalesQuantity',
          width: 120,
          align: 'right',
        },
        {
          title: '月销量',
          colKey: 'monthlySalesQuantity',
          width: 120,
          align: 'right',
        },
        {
          title: '周转天数',
          colKey: 'turnoverDays',
          width: 120,
          align: 'right',
          cell: ({ row: stockRow }) => {
            if (!stockRow.dailySalesQuantity || stockRow.dailySalesQuantity === 0) {
              return <span className='text-gray-400'>-</span>;
            }
            const turnoverDays = stockRow.stockQuantity / stockRow.dailySalesQuantity;
            return <span>{turnoverDays.toFixed(2)}</span>;
          },
        },
        {
          title: '补货预警阈值',
          colKey: 'reorderThreshold',
          width: 140,
          align: 'right',
          cell: ({ row: stockRow }) => {
            const isLowStock = stockRow.stockQuantity <= stockRow.reorderThreshold;
            // 计算周转天数
            const turnoverDays =
              stockRow.dailySalesQuantity && stockRow.dailySalesQuantity > 0
                ? stockRow.stockQuantity / stockRow.dailySalesQuantity
                : null;
            // 当补货预警数值大于周转天数时，显示为警告 Tag
            const isWarning = turnoverDays !== null && stockRow.reorderThreshold > turnoverDays;

            if (isWarning) {
              return <Tag theme='warning'>{stockRow.reorderThreshold}</Tag>;
            }
            if (isLowStock) {
              return <span className='text-red-600 font-semibold'>{stockRow.reorderThreshold}</span>;
            }
            return <span>{stockRow.reorderThreshold}</span>;
          },
        },
        {
          title: '更新时间',
          colKey: 'updatedAt',
          width: 180,
          cell: ({ row: stockRow }) => {
            if (!stockRow.updatedAt) return <span className='text-gray-400'>-</span>;
            const date = new Date(stockRow.updatedAt);
            return <span>{date.toLocaleString('zh-CN')}</span>;
          },
        },
        {
          title: '进货成本总货值',
          colKey: 'purchaseCostValue',
          width: 150,
          align: 'right',
          cell: ({ row: stockRow }) => {
            // 从父行数据获取进货成本
            const purchaseCost = row.purchaseCost;
            if (purchaseCost === null || purchaseCost === undefined) {
              return <span className='text-gray-400'>-</span>;
            }
            const value = stockRow.stockQuantity * purchaseCost;
            return <span>¥{value.toFixed(2)}</span>;
          },
        },
        {
          title: '操作',
          colKey: 'operation',
          fixed: 'right',
          width: 120,
          cell: ({ row: stockRow }) => (
            <Button variant='text' theme='primary' size='small' onClick={() => handleOpenReorderThreshold(stockRow)}>
              设置阈值
            </Button>
          ),
        },
      ];

      return (
        <div className='p-4 bg-gray-50'>
          <Table data={row.stockInfos} columns={stockColumns} rowKey='id' size='small' hover tableLayout='fixed' />
        </div>
      );
    },
    [handleOpenReorderThreshold],
  );

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      <Card bordered={false}>
        <Form ref={searchFormRef} labelWidth={80} colon>
          <Row>
            <Col flex='1'>
              <Row gutter={[16, 16]}>
                {/* 部门筛选（负责人可见，使用 DeptTreeSelect） */}
                {isLeader && (
                  <Col span={3} xs={12} sm={6} xl={3}>
                    <FormItem label='部门' name='departmentId'>
                      <DeptTreeSelect deptTreeData={deptTreeData} treeProps={{ checkStrictly: true }} />
                    </FormItem>
                  </Col>
                )}
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='SKU关键词' name='skuKeyword'>
                    <Input placeholder='请输入SKU关键词' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='仓库名称' name='warehouse'>
                    <Input placeholder='请输入仓库名称' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='补货预警' name='isLowStock'>
                    <Select placeholder='请选择' clearable options={[{ label: '预警中', value: true }]} />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='自动展开'>
                    <Switch value={autoExpand} onChange={(value) => setAutoExpand(value as boolean)} />
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
        {/* 工具栏 */}
        <CrudToolbar extraActions={toolbarExtraActions} />

        {/* 表格 */}
        <Table
          loading={tableLoading || deptLoading}
          data={list}
          columns={columns}
          rowKey='goodId'
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

      {/* 导入结果弹窗 */}
      <ImportResultModal visible={importResultVisible} result={importResult} onClose={handleCloseImportResult} />

      {/* 设置补货预警阈值弹窗 */}
      <ReorderThresholdModal
        visible={reorderThresholdVisible}
        stockInfo={currentStockInfo}
        formRef={reorderThresholdFormRef}
        onClose={handleCloseReorderThreshold}
        onSubmit={handleSubmitReorderThreshold}
      />
    </div>
  );
};

export default memo(JingCangStockManager);
