import { CrudToolbar } from 'components/CrudKit';
import { useCrudTable } from 'components/CrudKit/hooks';
import type { ToolbarActionConfig } from 'components/CrudKit/types';
import DeptTreeSelect, { useDeptTree } from 'components/DeptTreeSelect';
import { useDownloadNotify } from 'components/DownloadNotifyModal';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from 'services';
import type {
  SetYunCangReorderThresholdDto,
  YunCangStockGroupEntity,
  YunCangStockQueryDto,
  YunCangStockStatisticsEntity,
} from 'services/generated/model';
import { DownloadIcon } from 'tdesign-icons-react';
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
  Table,
  Tag,
} from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol, SortInfo } from 'tdesign-react/es/table';
import YunCangReorderThresholdModal from './components/YunCangReorderThresholdModal';

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
 * 云仓库存管理页面
 */
const YunCangStockManager: React.FC = () => {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'YunCang/index.tsx:79',
        message: '组件初始化',
        data: { component: 'YunCangStockManager' },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  // 部门筛选权限
  const { isLeader, deptTreeData, userDeptId, loading: deptLoading } = useDeptTree();

  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 导出功能
  const { startDownload, DownloadModal } = useDownloadNotify();

  // 补货预警阈值弹窗状态
  const [reorderThresholdVisible, setReorderThresholdVisible] = useState(false);
  const [currentStockInfo, setCurrentStockInfo] = useState<YunCangStockGroupEntity | null>(null);
  const reorderThresholdFormRef = useRef<FormInstanceFunctions>(null);

  // 统计数据状态
  const [statistics, setStatistics] = useState<YunCangStockStatisticsEntity | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // 排序状态（单列排序，使用 SortInfo）
  const [sort, setSort] = useState<SortInfo | undefined>(undefined);

  // 默认筛选条件（普通成员自动注入部门ID，默认按库存池数量降序排序）
  const defaultFilters = useMemo(() => {
    const filters: Partial<YunCangStockQueryDto> = {
      sortField: 'actualQuantity' as YunCangStockQueryDto['sortField'],
      sortOrder: 'desc',
    };
    if (!isLeader && userDeptId) {
      filters.departmentId = userDeptId;
    }
    return filters;
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
  } = useCrudTable<YunCangStockGroupEntity, YunCangStockQueryDto>({
    fetchApi: api.sysStockControllerListYunCangStock,
    defaultFilters,
    defaultPageSize: 10,
  });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'YunCang/index.tsx:133',
        message: '列表数据更新',
        data: { listLength: list.length, total, loading: tableLoading, hasError: false },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      }),
    }).catch(() => {});
  }, [list, total, tableLoading]);
  // #endregion

  // 从 filters 中提取查询参数（排除分页参数）
  const getStatisticsQuery = useCallback((currentFilters: YunCangStockQueryDto): YunCangStockQueryDto => {
    const { current, pageSize, ...queryParams } = currentFilters;
    // 统计接口不需要分页参数，但类型定义要求包含，所以传入默认值
    return {
      ...queryParams,
      current: 1,
      pageSize: 10,
    };
  }, []);

  // 获取统计数据
  const fetchStatistics = useCallback(async () => {
    const queryParams = getStatisticsQuery(filters);
    setStatisticsLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'YunCang/index.tsx:147',
          message: '开始获取统计数据',
          data: { queryParams },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      const res = await api.sysStockControllerStatisticsYunCangStock(queryParams);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'YunCang/index.tsx:160',
          message: '统计数据获取成功',
          data: { hasData: !!res.data, statistics: res.data },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      if (res.data) {
        setStatistics(res.data);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'YunCang/index.tsx:172',
          message: '获取统计数据失败',
          data: { error: String(error), errorMessage: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      console.error('获取统计数据失败:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, [filters, getStatisticsQuery]);

  // 监听筛选条件变化（排除分页变化）时刷新统计数据
  const previousQueryParamsRef = useRef<string>('');
  useEffect(() => {
    const queryParams = getStatisticsQuery(filters);
    const queryParamsStr = JSON.stringify(queryParams);

    // 只有当查询参数（排除分页）发生变化时才刷新统计数据
    if (queryParamsStr !== previousQueryParamsRef.current) {
      previousQueryParamsRef.current = queryParamsStr;
      fetchStatistics();
    }
  }, [filters, getStatisticsQuery, fetchStatistics]);

  // 同步 filters 中的排序状态到 sort state（初始化时设置默认排序）
  useEffect(() => {
    if (filters.sortField && filters.sortOrder) {
      setSort({
        sortBy: filters.sortField,
        descending: filters.sortOrder === 'desc',
      });
    } else {
      // 如果没有排序，使用默认排序（库存池数量降序）
      setSort({
        sortBy: 'actualQuantity',
        descending: true,
      });
    }
  }, [filters.sortField, filters.sortOrder]);

  // 导出云仓库存信息
  const handleExport = useCallback(() => {
    // 获取当前筛选条件（排除分页参数）
    const exportQuery = getStatisticsQuery(filters);

    startDownload({
      downloadFn: async () => {
        const response = await api.sysStockControllerExportYunCangStock(exportQuery);
        // 响应拦截器已经处理了 Blob 响应，直接返回
        if (response instanceof Blob) {
          return response;
        }
        // 如果不是 Blob，抛出错误
        throw new Error('导出失败：响应格式不正确');
      },
      defaultFileName: `云仓库存信息_${new Date().toISOString().split('T')[0]}.xlsx`,
      downloadText: '正在导出云仓库存信息，请稍候...',
      saveText: '导出完成，请点击保存按钮保存文件',
    });
  }, [filters, getStatisticsQuery, startDownload]);

  // 关闭设置补货预警阈值弹窗
  const handleCloseReorderThreshold = useCallback(() => {
    setReorderThresholdVisible(false);
    setCurrentStockInfo(null);
    reorderThresholdFormRef.current?.reset?.();
  }, []);

  // 打开设置补货预警阈值弹窗
  const handleOpenReorderThreshold = useCallback((stockInfo: YunCangStockGroupEntity) => {
    setCurrentStockInfo(stockInfo);
    setReorderThresholdVisible(true);
  }, []);

  // 提交设置补货预警阈值
  const handleSubmitReorderThreshold = useCallback(async () => {
    const formValues = reorderThresholdFormRef.current?.getFieldsValue?.(true) as SetYunCangReorderThresholdDto;
    if (!formValues || !currentStockInfo) return;

    try {
      await api.sysStockControllerSetYunCangReorderThreshold({
        goodId: currentStockInfo.goodId,
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
        // isLowStock 和 isSluggish 需要保持布尔值类型
        if (key === 'isLowStock' || key === 'isSluggish') {
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
    setSort(undefined);
    handleReset();
  }, [handleReset]);

  // 排序变化处理
  const handleSortChange = useCallback(
    (newSort: SortInfo | SortInfo[]) => {
      // 单列排序，取第一个元素（如果是数组）或直接使用
      const sortInfo = Array.isArray(newSort) ? newSort[0] : newSort;
      setSort(sortInfo);

      // 更新筛选条件中的排序参数
      const sortFieldMap: Record<
        string,
        'actualQuantity' | 'dailySalesQuantity' | 'monthlySalesQuantity' | 'reorderThreshold' | 'sluggishDays'
      > = {
        actualQuantity: 'actualQuantity',
        dailySalesQuantity: 'dailySalesQuantity',
        monthlySalesQuantity: 'monthlySalesQuantity',
        reorderThreshold: 'reorderThreshold',
        sluggishDays: 'sluggishDays',
      };

      if (sortInfo && sortInfo.sortBy) {
        const sortField = sortFieldMap[sortInfo.sortBy];
        if (sortField) {
          handleSearch({
            sortField: sortField as YunCangStockQueryDto['sortField'],
            sortOrder: sortInfo.descending ? 'desc' : 'asc',
            current: 1, // 排序时重置到第一页
          });
        }
      } else {
        // 取消排序
        handleSearch({
          sortField: undefined,
          sortOrder: undefined,
          current: 1,
        });
      }
    },
    [handleSearch],
  );

  // 工具栏额外按钮
  const toolbarExtraActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        key: 'export',
        label: '导出库存信息',
        icon: <DownloadIcon />,
        onClick: handleExport,
      },
    ],
    [handleExport],
  );

  // 构建表格列配置
  const columns = useMemo<PrimaryTableCol<YunCangStockGroupEntity>[]>(() => {
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
        title: '产品图片',
        colKey: 'imageUrl',
        width: 100,
        cell: ({ row }) => <ImageCell url={row.imageUrl} />,
      },
      {
        title: '库存池数量',
        colKey: 'actualQuantity',
        width: 120,
        align: 'right',
        sortType: 'all',
        sorter: true,
      },
      {
        title: '日销量',
        colKey: 'dailySalesQuantity',
        width: 120,
        align: 'right',
        sortType: 'all',
        sorter: true,
      },
      {
        title: '月销量',
        colKey: 'monthlySalesQuantity',
        width: 120,
        align: 'right',
        sortType: 'all',
        sorter: true,
      },
      {
        title: '补货预警阈值',
        colKey: 'reorderThreshold',
        width: 140,
        align: 'right',
        sortType: 'all',
        sorter: true,
        cell: ({ row }) => {
          if (row.reorderThreshold === null || row.reorderThreshold === undefined) {
            return <span className='text-gray-400'>-</span>;
          }
          const isLowStock = row.actualQuantity <= row.reorderThreshold;
          return isLowStock ? (
            <span className='text-red-600 font-semibold'>{row.reorderThreshold}</span>
          ) : (
            <span>{row.reorderThreshold}</span>
          );
        },
      },
      {
        title: '滞销天数',
        colKey: 'sluggishDays',
        width: 120,
        align: 'right',
        sortType: 'all',
        sorter: true,
        cell: ({ row }) => {
          const sluggishDays = row.sluggishDays || 0;
          if (sluggishDays > 7) {
            return <Tag theme='warning'>滞销产品</Tag>;
          }
          return <span>{sluggishDays}</span>;
        },
      },
      {
        title: '操作',
        colKey: 'operation',
        fixed: 'right',
        width: 120,
        cell: ({ row }) => {
          return (
            <Button variant='text' theme='primary' size='small' onClick={() => handleOpenReorderThreshold(row)}>
              设置阈值
            </Button>
          );
        },
      },
    ];
  }, [handleOpenReorderThreshold]);

  // #region agent log
  useEffect(() => {
    try {
      fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'YunCang/index.tsx:540',
          message: '开始渲染组件',
          data: { listLength: list.length, statistics: !!statistics },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {});
    } catch (error) {
      fetch('http://127.0.0.1:7242/ingest/e26a29e9-ef83-43ae-8a86-c61ec93f20b7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'YunCang/index.tsx:540',
          message: '渲染前错误',
          data: { error: String(error) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {});
    }
  }, [list, statistics]);
  // #endregion

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
                  <FormItem label='负责人' name='responsiblePerson'>
                    <Input placeholder='请输入负责人' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='店铺名称' name='shopName'>
                    <Input placeholder='请输入店铺名称' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='补货预警' name='isLowStock'>
                    <Select placeholder='请选择' clearable options={[{ label: '预警中', value: true }]} />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='滞销产品' name='isSluggish'>
                    <Select placeholder='请选择' clearable options={[{ label: '滞销产品', value: true }]} />
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
        {/* 工具栏和统计信息 */}
        <div className='mb-4 flex items-center justify-between'>
          <CrudToolbar extraActions={toolbarExtraActions} />
          {/* 统计信息 */}
          {statisticsLoading ? (
            <div className='text-sm text-gray-400'>统计加载中...</div>
          ) : statistics ? (
            <div className='flex items-center gap-6 rounded-lg bg-gray-50 px-4 py-2'>
              <div className='flex flex-col items-end border-r border-gray-200 pr-6'>
                <span className='mb-1 text-xs text-gray-500'>总日销量</span>
                <span className='text-lg font-semibold text-gray-800'>
                  {statistics.totalDailySalesQuantity.toLocaleString()}
                </span>
              </div>
              <div className='flex flex-col items-end border-r border-gray-200 pr-6'>
                <span className='mb-1 text-xs text-gray-500'>总月销量</span>
                <span className='text-lg font-semibold text-gray-800'>
                  {statistics.totalMonthlySalesQuantity.toLocaleString()}
                </span>
              </div>
              <div className='flex flex-col items-end'>
                <span className='mb-1 text-xs text-gray-500'>总库存数量</span>
                <span className='text-lg font-semibold text-blue-600'>
                  {statistics.totalStockQuantity.toLocaleString()}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 表格 */}
        <Table
          loading={tableLoading || deptLoading}
          data={list}
          columns={columns}
          rowKey='goodId'
          hover
          tableLayout='fixed'
          horizontalScrollAffixedBottom
          sort={sort}
          onSortChange={handleSortChange}
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* 设置补货预警阈值弹窗 */}
      <YunCangReorderThresholdModal
        visible={reorderThresholdVisible}
        stockInfo={currentStockInfo}
        formRef={reorderThresholdFormRef}
        onClose={handleCloseReorderThreshold}
        onSubmit={handleSubmitReorderThreshold}
      />

      {/* 导出下载弹窗 */}
      <DownloadModal />
    </div>
  );
};

export default memo(YunCangStockManager);
