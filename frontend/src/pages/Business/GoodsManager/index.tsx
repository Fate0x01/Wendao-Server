import { fileOpen } from 'browser-fs-access';
import { CrudFormModal, CrudToolbar } from 'components/CrudKit';
import { useCrudModal, useCrudTable } from 'components/CrudKit/hooks';
import type { ToolbarActionConfig } from 'components/CrudKit/types';
import DeptTreeSelect, { useDeptTree } from 'components/DeptTreeSelect';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import api from 'services';
import type { GoodsEntity, GoodsImportResultEntity, GoodsQueryDto, UpdateGoodsDto } from 'services/generated/model';
import {
  ChevronLeftDoubleIcon,
  ChevronRightDoubleIcon,
  DownloadIcon,
  UploadIcon,
  WalletIcon,
} from 'tdesign-icons-react';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  ImageViewer,
  Input,
  MessagePlugin,
  Popconfirm,
  Row,
  Table,
  Tag,
} from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import ExtraCostModal from './components/ExtraCostModal';
import GoodsFormFields from './components/GoodsFormFields';
import ImportResultModal from './components/ImportResultModal';
import { BASE_COLUMNS, calcNetProfitMargin, calcProfit, COST_DETAIL_COLUMNS, DEFAULT_PAGE_SIZE } from './constants';

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

const { FormItem } = Form;

/**
 * 商品管理页面
 */
const GoodsManager: React.FC = () => {
  // 部门筛选权限
  const { isLeader, deptTreeData, userDeptId, loading: deptLoading } = useDeptTree();

  // 搜索表单引用
  const searchFormRef = useRef<FormInstanceFunctions>(null);

  // 额外成本弹窗状态
  const [extraCostVisible, setExtraCostVisible] = useState(false);
  const [currentGoods, setCurrentGoods] = useState<GoodsEntity | null>(null);

  // 导入结果弹窗状态
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [importResult, setImportResult] = useState<GoodsImportResultEntity | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // 费用明细列展开状态
  const [showCostDetails, setShowCostDetails] = useState(false);

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
  } = useCrudTable<GoodsEntity, GoodsQueryDto>({
    fetchApi: api.sysGoodsControllerGetGoodsList,
    defaultFilters,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  // 编辑弹窗管理
  const {
    visible: editVisible,
    editData,
    isEdit,
    formRef,
    loading: editLoading,
    openEdit,
    close: closeEdit,
    handleSubmit,
  } = useCrudModal<GoodsEntity, never, UpdateGoodsDto>({
    updateApi: api.sysGoodsControllerUpdateGoods,
    onSuccess: refresh,
    successMessage: { update: '保存成功' },
  });

  // 删除商品
  const handleDelete = useCallback(
    async (record: GoodsEntity) => {
      try {
        await api.sysGoodsControllerDeleteGoods(record.id);
        MessagePlugin.success('删除成功');
        refresh();
      } catch (error) {
        console.error('删除商品失败:', error);
        MessagePlugin.error('删除失败');
      }
    },
    [refresh],
  );

  // 打开额外成本弹窗
  const handleOpenExtraCost = useCallback((record: GoodsEntity) => {
    setCurrentGoods(record);
    setExtraCostVisible(true);
  }, []);

  // 关闭额外成本弹窗
  const handleCloseExtraCost = useCallback(() => {
    setExtraCostVisible(false);
    setCurrentGoods(null);
  }, []);

  // 下载模板
  const handleDownloadTemplate = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/template/商品信息导入模板.xlsx';
    link.download = '商品信息导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // 导入商品
  const handleImport = useCallback(async () => {
    try {
      const file = await fileOpen({
        mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        extensions: ['.xlsx', '.xls'],
        description: '选择商品导入文件',
      });

      setImportLoading(true);
      const res = await api.sysGoodsControllerImportGoods({ file });

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
        console.error('导入商品失败:', error);
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

  // 表单提交处理
  const onFormSubmit = useCallback(() => {
    handleSubmit((values: Record<string, unknown>) => {
      // 编辑时带上 id
      if (isEdit && editData) {
        return { ...values, id: editData.id };
      }
      return values;
    });
  }, [handleSubmit, isEdit, editData]);

  // 弹窗打开后填充表单
  const handleDialogOpened = useCallback(() => {
    if (editData) {
      formRef.current?.setFieldsValue(editData as unknown as Record<string, unknown>);
    }
  }, [editData, formRef]);

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

  // 切换费用明细列显示
  const handleToggleCostDetails = useCallback(() => {
    setShowCostDetails((prev) => !prev);
  }, []);

  // 工具栏额外按钮
  const toolbarExtraActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        key: 'toggleCostDetails',
        label: showCostDetails ? '收起费用明细' : '展开费用明细',
        icon: showCostDetails ? <ChevronLeftDoubleIcon /> : <ChevronRightDoubleIcon />,
        onClick: handleToggleCostDetails,
      },
      {
        key: 'download',
        label: '下载模板',
        icon: <DownloadIcon />,
        onClick: handleDownloadTemplate,
      },
      {
        key: 'import',
        label: '导入商品',
        icon: <UploadIcon />,
        onClick: handleImport,
        disabled: importLoading,
      },
    ],
    [showCostDetails, handleToggleCostDetails, handleDownloadTemplate, handleImport, importLoading],
  );

  // 为列添加自定义渲染逻辑
  const applyCustomRenderers = useCallback((col: PrimaryTableCol<GoodsEntity>): PrimaryTableCol<GoodsEntity> => {
    if (col.colKey === 'sku') {
      return { ...col, cell: ({ row }: { row: GoodsEntity }) => <SkuCell sku={row.sku} /> };
    }
    if (col.colKey === 'imageUrl') {
      return { ...col, cell: ({ row }: { row: GoodsEntity }) => <ImageCell url={row.imageUrl} /> };
    }
    if (col.colKey === 'certificateImageUrl') {
      return { ...col, cell: ({ row }: { row: GoodsEntity }) => <ImageCell url={row.certificateImageUrl} /> };
    }
    if (col.colKey === 'profit') {
      return {
        ...col,
        cell: ({ row }: { row: GoodsEntity }) => {
          const profit = calcProfit(row);
          if (profit == null) return '-';
          const color = profit >= 0 ? 'text-green-600' : 'text-red-600';
          return <span className={color}>¥{profit.toFixed(2)}</span>;
        },
      };
    }
    if (col.colKey === 'netProfitMargin') {
      return {
        ...col,
        cell: ({ row }: { row: GoodsEntity }) => {
          const margin = calcNetProfitMargin(row);
          if (margin == null) return '-';
          const color = margin >= 0 ? 'text-green-600' : 'text-red-600';
          return <span className={color}>{margin.toFixed(2)}%</span>;
        },
      };
    }
    return col;
  }, []);

  // 构建表格列配置
  const columns = useMemo<PrimaryTableCol<GoodsEntity>[]>(() => {
    // 基础列
    const baseCols = BASE_COLUMNS.map(applyCustomRenderers);

    // 费用明细列（根据状态决定是否显示）
    const costDetailCols = showCostDetails ? COST_DETAIL_COLUMNS.map(applyCustomRenderers) : [];

    // 操作列
    const operationCol: PrimaryTableCol<GoodsEntity> = {
      title: '操作',
      colKey: 'operation',
      fixed: 'right',
      width: 180,
      cell: ({ row }: { row: GoodsEntity }) => (
        <div className='flex gap-1'>
          <Button variant='text' theme='primary' size='small' onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button
            variant='text'
            theme='primary'
            size='small'
            icon={<WalletIcon />}
            onClick={() => handleOpenExtraCost(row)}
          >
            额外成本
          </Button>
          <Popconfirm content='确定删除该商品？' onConfirm={() => handleDelete(row)}>
            <Button variant='text' theme='danger' size='small'>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    };

    return [...baseCols, ...costDetailCols, operationCol];
  }, [showCostDetails, applyCustomRenderers, openEdit, handleOpenExtraCost, handleDelete]);

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
                  <FormItem label='店铺名称' name='shopName'>
                    <Input placeholder='请输入店铺名称' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='SKU' name='skuKeyword'>
                    <Input placeholder='请输入SKU关键词' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='负责人' name='responsiblePerson'>
                    <Input placeholder='请输入负责人' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='货架号' name='shelfNumber'>
                    <Input placeholder='请输入货架号' />
                  </FormItem>
                </Col>
                <Col span={3} xs={12} sm={6} xl={3}>
                  <FormItem label='入仓条码' name='inboundBarcode'>
                    <Input placeholder='请输入入仓条码' />
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

      {/* 编辑弹窗 */}
      <CrudFormModal
        title={{ add: '新增商品', edit: '编辑商品' }}
        visible={editVisible}
        isEdit={isEdit}
        formRef={formRef}
        loading={editLoading}
        width={700}
        onClose={closeEdit}
        onSubmit={onFormSubmit}
        onOpened={handleDialogOpened}
        renderForm={(edit) => <GoodsFormFields deptTreeData={deptTreeData} isEdit={edit} />}
        labelWidth={120}
      />

      {/* 额外成本弹窗 */}
      {currentGoods && (
        <ExtraCostModal
          visible={extraCostVisible}
          goodsId={currentGoods.id}
          extraCosts={currentGoods.extraCosts || []}
          onClose={handleCloseExtraCost}
          onRefresh={() => {
            handleCloseExtraCost();
            refresh();
          }}
        />
      )}

      {/* 导入结果弹窗 */}
      <ImportResultModal visible={importResultVisible} result={importResult} onClose={handleCloseImportResult} />
    </div>
  );
};

export default memo(GoodsManager);
