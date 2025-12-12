import React, { memo, useCallback, useEffect, useState } from 'react';
import api from 'services';
import type { SetSharedInventoryPoolDto } from 'services/generated/model';
import { Button, Dialog, Form, Input, MessagePlugin, Tag } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';

const { FormItem } = Form;

interface SetSharedInventoryPoolModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 表单引用 */
  formRef: React.RefObject<FormInstanceFunctions>;
  /** 关闭回调 */
  onClose: () => void;
  /** 提交回调 */
  onSubmit: () => void;
}

/**
 * 设置多个SKU共用库存池弹窗组件
 */
const SetSharedInventoryPoolModal: React.FC<SetSharedInventoryPoolModalProps> = ({
  visible,
  formRef,
  onClose,
  onSubmit,
}) => {
  const [skus, setSkus] = useState<string[]>([]);
  const [currentSku, setCurrentSku] = useState('');

  // 弹窗打开时重置表单
  useEffect(() => {
    if (visible && formRef.current) {
      setSkus([]);
      setCurrentSku('');
      formRef.current.reset();
    }
  }, [visible, formRef]);

  // 同步 skus 到表单
  useEffect(() => {
    if (formRef.current) {
      formRef.current.setFieldsValue({ skus });
    }
  }, [skus, formRef]);

  // 添加SKU
  const handleAddSku = useCallback(() => {
    const trimmedSku = currentSku.trim();
    if (!trimmedSku) {
      MessagePlugin.warning('请输入SKU');
      return;
    }
    if (skus.includes(trimmedSku)) {
      MessagePlugin.warning('SKU已存在');
      return;
    }
    setSkus([...skus, trimmedSku]);
    setCurrentSku('');
  }, [currentSku, skus]);

  // 删除SKU
  const handleRemoveSku = useCallback(
    (skuToRemove: string) => {
      setSkus(skus.filter((sku) => sku !== skuToRemove));
    },
    [skus],
  );

  // 处理回车键添加SKU
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSku();
      }
    },
    [handleAddSku],
  );

  // 提交前验证
  const handleSubmit = useCallback(() => {
    if (skus.length < 2) {
      MessagePlugin.warning('至少需要选择2个SKU');
      return;
    }
    // 直接调用 onSubmit，由父组件从表单获取值
    onSubmit();
  }, [skus, onSubmit]);

  return (
    <Dialog
      header='设置多个SKU共用库存池'
      visible={visible}
      onClose={onClose}
      width={600}
      footer={
        <>
          <Button variant='base' theme='default' onClick={onClose}>
            取消
          </Button>
          <Button theme='primary' onClick={handleSubmit}>
            确定
          </Button>
        </>
      }
    >
      <Form ref={formRef} labelWidth={120} colon>
        <FormItem
          label='SKU列表'
          name='skus'
          rules={[
            { required: true, message: '至少需要选择2个SKU' },
            {
              validator: (val) => {
                if (!val || !Array.isArray(val) || val.length < 2) {
                  return { result: false, message: '至少需要选择2个SKU' };
                }
                return { result: true };
              },
            },
          ]}
        >
          <div>
            <div className='mb-2 flex gap-2'>
              <Input
                value={currentSku}
                onChange={(value) => setCurrentSku(value)}
                placeholder='请输入SKU，按回车或点击添加按钮'
                onEnter={handleAddSku}
                onKeyPress={handleKeyPress}
              />
              <Button theme='primary' onClick={handleAddSku}>
                添加
              </Button>
            </div>
            {skus.length > 0 && (
              <div className='flex flex-wrap gap-2 rounded border border-gray-200 bg-gray-50 p-3'>
                {skus.map((sku) => (
                  <Tag
                    key={sku}
                    closable
                    onClose={() => handleRemoveSku(sku)}
                    theme='primary'
                    variant='light'
                  >
                    {sku}
                  </Tag>
                ))}
              </div>
            )}
            <div className='mt-2 text-xs text-gray-500'>
              已选择 {skus.length} 个SKU，至少需要2个SKU才能设置共用库存池
            </div>
          </div>
        </FormItem>
      </Form>
    </Dialog>
  );
};

export default memo(SetSharedInventoryPoolModal);

