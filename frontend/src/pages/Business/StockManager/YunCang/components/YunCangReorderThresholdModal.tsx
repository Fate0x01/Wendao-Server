import React, { memo, useEffect } from 'react';
import type { YunCangStockInfoEntity } from 'services/generated/model';
import { Button, Dialog, Form, InputNumber } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';

const { FormItem } = Form;

interface YunCangReorderThresholdModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 库存信息 */
  stockInfo: YunCangStockInfoEntity | null;
  /** 表单引用 */
  formRef: React.RefObject<FormInstanceFunctions>;
  /** 关闭回调 */
  onClose: () => void;
  /** 提交回调 */
  onSubmit: () => void;
}

/**
 * 设置云仓补货预警阈值弹窗组件
 */
const YunCangReorderThresholdModal: React.FC<YunCangReorderThresholdModalProps> = ({
  visible,
  stockInfo,
  formRef,
  onClose,
  onSubmit,
}) => {
  // 弹窗打开后填充表单
  useEffect(() => {
    if (visible && stockInfo && formRef.current) {
      formRef.current.setFieldsValue({
        reorderThreshold: stockInfo.reorderThreshold,
      });
    }
  }, [visible, stockInfo, formRef]);

  return (
    <Dialog
      header='设置补货预警阈值'
      visible={visible}
      onClose={onClose}
      width={500}
      footer={
        <>
          <Button variant='base' theme='default' onClick={onClose}>
            取消
          </Button>
          <Button theme='primary' onClick={onSubmit}>
            确定
          </Button>
        </>
      }
    >
      <Form ref={formRef} labelWidth={120} colon>
        {stockInfo && (
          <>
            <FormItem label='商品ID'>{stockInfo.id}</FormItem>
            <FormItem
              label='补货预警阈值'
              name='reorderThreshold'
              rules={[
                { required: true, message: '请输入补货预警阈值' },
                { type: 'number', min: 0, message: '补货预警阈值不能小于0' },
              ]}
            >
              <InputNumber placeholder='请输入补货预警阈值' min={0} precision={0} />
            </FormItem>
          </>
        )}
      </Form>
    </Dialog>
  );
};

export default memo(YunCangReorderThresholdModal);
