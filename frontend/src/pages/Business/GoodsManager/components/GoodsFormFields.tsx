import React, { memo } from 'react';
import { Divider, Form, Input, InputNumber, TagInput, TreeSelect } from 'tdesign-react';
import type { DeptTreeNode } from '../hooks/useDeptFilter';

const { FormItem } = Form;

interface GoodsFormFieldsProps {
  /** 部门树数据 */
  deptTreeData: DeptTreeNode[];
  /** 是否编辑模式 */
  isEdit?: boolean;
}

/**
 * 商品编辑表单字段组件
 * 分三组展示：基本信息、成本信息、比例设置
 */
const GoodsFormFields: React.FC<GoodsFormFieldsProps> = ({ deptTreeData, isEdit }) => {
  return (
    <>
      {/* 基本信息 */}
      <Divider align='left'>基本信息</Divider>
      <FormItem label='所属部门' name='departmentId' rules={[{ required: true, message: '请选择部门' }]}>
        <TreeSelect data={deptTreeData} placeholder='请选择部门' clearable filterable disabled={isEdit} />
      </FormItem>
      <FormItem label='店铺名称' name='shopName'>
        <Input placeholder='请输入店铺名称' />
      </FormItem>
      <FormItem label='SKU' name='sku' rules={[{ required: true, message: '请输入至少一个SKU' }]}>
        <TagInput placeholder='输入后按回车添加SKU' />
      </FormItem>
      <FormItem label='货架号' name='shelfNumber'>
        <Input placeholder='请输入货架号' />
      </FormItem>
      <FormItem label='产品图片URL' name='imageUrl'>
        <Input placeholder='请输入产品图片URL' />
      </FormItem>
      <FormItem label='入仓条码' name='inboundBarcode'>
        <Input placeholder='请输入入仓条码' />
      </FormItem>
      <FormItem label='产品规格' name='spec'>
        <Input placeholder='请输入产品规格' />
      </FormItem>
      <FormItem label='合格证图URL' name='certificateImageUrl'>
        <Input placeholder='请输入合格证图URL' />
      </FormItem>

      {/* 成本信息 */}
      <Divider align='left'>成本信息</Divider>
      <FormItem label='进货成本' name='purchaseCost'>
        <InputNumber placeholder='请输入进货成本' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='最低售价' name='minSalePrice'>
        <InputNumber placeholder='请输入最低售价' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='快递费用' name='expressFee'>
        <InputNumber placeholder='请输入快递费用' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='耗材费' name='materialCost'>
        <InputNumber placeholder='请输入耗材费' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='销售出库费' name='salesOutboundFee'>
        <InputNumber placeholder='请输入销售出库费' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='TC到仓费' name='tcToWarehouseFee'>
        <InputNumber placeholder='请输入TC到仓费' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>
      <FormItem label='人工打包费' name='manualPackingFee'>
        <InputNumber placeholder='请输入人工打包费' min={0} decimalPlaces={2} suffix='元' style={{ width: '100%' }} />
      </FormItem>

      {/* 比例设置 */}
      <Divider align='left'>比例设置</Divider>
      <FormItem label='交易服务费比例' name='transactionServiceRatio'>
        <InputNumber
          placeholder='请输入交易服务费比例'
          min={0}
          max={100}
          decimalPlaces={2}
          suffix='%'
          style={{ width: '100%' }}
        />
      </FormItem>
      <FormItem label='佣金比例' name='commissionRatio'>
        <InputNumber
          placeholder='请输入佣金比例'
          min={0}
          max={100}
          decimalPlaces={2}
          suffix='%'
          style={{ width: '100%' }}
        />
      </FormItem>
      <FormItem label='平台推广比例' name='platformPromotionRatio'>
        <InputNumber
          placeholder='请输入平台推广比例'
          min={0}
          max={100}
          decimalPlaces={2}
          suffix='%'
          style={{ width: '100%' }}
        />
      </FormItem>
      <FormItem label='货损比例' name='lossRatio'>
        <InputNumber
          placeholder='请输入货损比例'
          min={0}
          max={100}
          decimalPlaces={2}
          suffix='%'
          style={{ width: '100%' }}
        />
      </FormItem>
    </>
  );
};

export default memo(GoodsFormFields);
