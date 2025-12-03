import type { SearchFieldConfig } from 'components/CrudKit/types';
import type { GoodsEntity } from 'services/generated/model';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

/**
 * 搜索字段配置
 */
export const SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    name: 'shopName',
    label: '店铺名称',
    type: 'input',
    placeholder: '请输入店铺名称',
    span: 3,
  },
  {
    name: 'skuKeyword',
    label: 'SKU',
    type: 'input',
    placeholder: '请输入SKU关键词',
    span: 3,
  },
  {
    name: 'shelfNumber',
    label: '货架号',
    type: 'input',
    placeholder: '请输入货架号',
    span: 3,
  },
  {
    name: 'inboundBarcode',
    label: '入仓条码',
    type: 'input',
    placeholder: '请输入入仓条码',
    span: 3,
  },
];

/**
 * 计算额外成本总和
 */
export const calcExtraCostTotal = (row: GoodsEntity): number => {
  if (!row.extraCosts || row.extraCosts.length === 0) return 0;
  return row.extraCosts.reduce((sum, item) => sum + item.amount, 0);
};

/**
 * 计算利润
 * 利润 = 最低售价 - 进货成本 - 固定成本 - 比例成本 - 额外成本
 * 固定成本：快递费用 + 耗材费 + 销售出库费 + TC到仓费 + 人工打包费
 * 比例成本：(交易服务费比例 + 佣金比例 + 平台推广比例 + 货损比例) * 最低售价 / 100
 */
export const calcProfit = (row: GoodsEntity): number | null => {
  // 必须有最低售价和进货成本才能计算
  if (row.minSalePrice == null || row.purchaseCost == null) return null;

  // 固定成本
  const fixedCosts = [
    row.expressFee ?? 0,
    row.materialCost ?? 0,
    row.salesOutboundFee ?? 0,
    row.tcToWarehouseFee ?? 0,
    row.manualPackingFee ?? 0,
  ];

  // 比例成本（基于最低售价计算）
  const ratios = [
    row.transactionServiceRatio ?? 0,
    row.commissionRatio ?? 0,
    row.platformPromotionRatio ?? 0,
    row.lossRatio ?? 0,
  ];
  const ratioCost = (ratios.reduce((sum, r) => sum + r, 0) * row.minSalePrice) / 100;

  // 额外成本
  const extraCost = calcExtraCostTotal(row);

  // 总成本
  const totalCost = row.purchaseCost + fixedCosts.reduce((sum, c) => sum + c, 0) + ratioCost + extraCost;

  return row.minSalePrice - totalCost;
};

/**
 * 格式化比例显示：原始比例% + 计算金额
 * 如：1% 0.45
 */
const formatRatio = (ratio: number | null | undefined, minSalePrice: number | null | undefined): string => {
  if (ratio == null) return '-';
  if (minSalePrice == null) return `${ratio}%`;
  const amount = (ratio * minSalePrice) / 100;
  return `${ratio}% ¥${amount.toFixed(2)}`;
};

/**
 * 表格列配置（不含操作列）
 */
export const TABLE_COLUMNS: PrimaryTableCol<GoodsEntity>[] = [
  {
    title: '部门',
    colKey: 'departmentName',
    width: 120,
    fixed: 'left',
    ellipsis: true,
  },
  {
    title: '店铺名称',
    colKey: 'shopName',
    width: 140,
    ellipsis: true,
  },
  {
    title: 'SKU',
    colKey: 'sku',
    width: 180,
    // 自定义渲染在页面中实现
  },
  {
    title: '货架号',
    colKey: 'shelfNumber',
    width: 100,
    ellipsis: true,
  },
  {
    title: '产品图片',
    colKey: 'imageUrl',
    width: 100,
    // 自定义渲染在页面中实现
  },
  {
    title: '合格证图',
    colKey: 'certificateImageUrl',
    width: 100,
    // 自定义渲染在页面中实现
  },
  {
    title: '入仓条码',
    colKey: 'inboundBarcode',
    width: 120,
    ellipsis: true,
  },
  {
    title: '规格',
    colKey: 'spec',
    width: 100,
    ellipsis: true,
  },
  {
    title: '进货成本',
    colKey: 'purchaseCost',
    width: 100,
    align: 'right',
    cell: ({ row }) => (row.purchaseCost != null ? `¥${row.purchaseCost.toFixed(2)}` : '-'),
  },
  {
    title: '最低售价',
    colKey: 'minSalePrice',
    width: 100,
    align: 'right',
    cell: ({ row }) => (row.minSalePrice != null ? `¥${row.minSalePrice.toFixed(2)}` : '-'),
  },
  {
    title: '利润',
    colKey: 'profit',
    width: 100,
    align: 'right',
    // 自定义渲染在页面中实现（需要 JSX 支持颜色区分）
  },
  {
    title: '快递费用',
    colKey: 'expressFee',
    width: 100,
    align: 'right',
    cell: ({ row }) => (row.expressFee != null ? `¥${row.expressFee.toFixed(2)}` : '-'),
  },
  {
    title: '耗材费',
    colKey: 'materialCost',
    width: 100,
    align: 'right',
    cell: ({ row }) => (row.materialCost != null ? `¥${row.materialCost.toFixed(2)}` : '-'),
  },
  {
    title: '销售出库费',
    colKey: 'salesOutboundFee',
    width: 125,
    align: 'right',
    cell: ({ row }) => (row.salesOutboundFee != null ? `¥${row.salesOutboundFee.toFixed(2)}` : '-'),
  },
  {
    title: 'TC到仓费',
    colKey: 'tcToWarehouseFee',
    width: 100,
    align: 'right',
    cell: ({ row }) => (row.tcToWarehouseFee != null ? `¥${row.tcToWarehouseFee.toFixed(2)}` : '-'),
  },
  {
    title: '人工打包费',
    colKey: 'manualPackingFee',
    width: 125,
    align: 'right',
    cell: ({ row }) => (row.manualPackingFee != null ? `¥${row.manualPackingFee.toFixed(2)}` : '-'),
  },
  {
    title: '交易服务费',
    colKey: 'transactionServiceRatio',
    width: 130,
    align: 'right',
    cell: ({ row }) => formatRatio(row.transactionServiceRatio, row.minSalePrice),
  },
  {
    title: '佣金',
    colKey: 'commissionRatio',
    width: 120,
    align: 'right',
    cell: ({ row }) => formatRatio(row.commissionRatio, row.minSalePrice),
  },
  {
    title: '平台推广',
    colKey: 'platformPromotionRatio',
    width: 130,
    align: 'right',
    cell: ({ row }) => formatRatio(row.platformPromotionRatio, row.minSalePrice),
  },
  {
    title: '货损',
    colKey: 'lossRatio',
    width: 120,
    align: 'right',
    cell: ({ row }) => formatRatio(row.lossRatio, row.minSalePrice),
  },
  {
    title: '创建时间',
    colKey: 'createdAt',
    width: 170,
    cell: ({ row }) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
];

/**
 * 表单分组配置
 */
export const FORM_GROUPS = {
  basic: {
    title: '基本信息',
    fields: [
      'departmentId',
      'shopName',
      'sku',
      'shelfNumber',
      'imageUrl',
      'inboundBarcode',
      'spec',
      'certificateImageUrl',
    ],
  },
  cost: {
    title: '成本信息',
    fields: [
      'purchaseCost',
      'minSalePrice',
      'expressFee',
      'materialCost',
      'salesOutboundFee',
      'tcToWarehouseFee',
      'manualPackingFee',
    ],
  },
  ratio: {
    title: '比例设置',
    fields: ['transactionServiceRatio', 'commissionRatio', 'platformPromotionRatio', 'lossRatio'],
  },
} as const;

/**
 * 默认分页大小
 */
export const DEFAULT_PAGE_SIZE = 10;
