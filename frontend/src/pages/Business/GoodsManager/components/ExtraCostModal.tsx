import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import api from 'services';
import type { ExtraCostEntity } from 'services/generated/model';
import { Button, Dialog, Form, Input, InputNumber, MessagePlugin, Popconfirm, Table } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { PrimaryTableCol } from 'tdesign-react/es/table';

const { FormItem } = Form;

interface ExtraCostModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 商品ID */
  goodsId: string;
  /** 额外成本列表 */
  extraCosts: ExtraCostEntity[];
  /** 关闭回调 */
  onClose: () => void;
  /** 数据变更后刷新回调 */
  onRefresh: () => void;
}

/**
 * 额外成本管理弹窗组件
 */
const ExtraCostModal: React.FC<ExtraCostModalProps> = ({ visible, goodsId, extraCosts, onClose, onRefresh }) => {
  const formRef = useRef<FormInstanceFunctions>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // 计算总金额
  const totalAmount = useMemo(() => {
    return extraCosts.reduce((sum, item) => sum + item.amount, 0);
  }, [extraCosts]);

  // 添加额外成本
  const handleAdd = useCallback(async () => {
    const validateResult = await formRef.current?.validate?.();
    if (validateResult !== true) return;

    const formValues = formRef.current?.getFieldsValue?.(true) as { amount: number; description?: string };

    setAddLoading(true);
    try {
      await api.sysGoodsControllerAddExtraCost({
        goodId: goodsId,
        amount: formValues.amount,
        description: formValues.description,
      });
      MessagePlugin.success('添加成功');
      formRef.current?.reset?.();
      onRefresh();
    } catch (error) {
      console.error('添加额外成本失败:', error);
      MessagePlugin.error('添加失败');
    } finally {
      setAddLoading(false);
    }
  }, [goodsId, onRefresh]);

  // 删除额外成本
  const handleDelete = useCallback(
    async (id: string) => {
      setDeleteLoadingId(id);
      try {
        await api.sysGoodsControllerDeleteExtraCost(id);
        MessagePlugin.success('删除成功');
        onRefresh();
      } catch (error) {
        console.error('删除额外成本失败:', error);
        MessagePlugin.error('删除失败');
      } finally {
        setDeleteLoadingId(null);
      }
    },
    [onRefresh],
  );

  // 表格列配置
  const columns = useMemo<PrimaryTableCol<ExtraCostEntity>[]>(
    () => [
      {
        title: '金额',
        colKey: 'amount',
        width: 120,
        align: 'right',
        cell: ({ row }) => `¥${row.amount.toFixed(2)}`,
      },
      {
        title: '描述',
        colKey: 'description',
        ellipsis: true,
        cell: ({ row }) => row.description || '-',
      },
      {
        title: '创建时间',
        colKey: 'createdAt',
        width: 170,
        cell: ({ row }) => new Date(row.createdAt).toLocaleString('zh-CN'),
      },
      {
        title: '操作',
        colKey: 'operation',
        width: 80,
        cell: ({ row }) => (
          <Popconfirm content='确定删除该额外成本？' onConfirm={() => handleDelete(row.id)}>
            <Button theme='danger' variant='text' size='small' loading={deleteLoadingId === row.id}>
              删除
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [handleDelete, deleteLoadingId],
  );

  return (
    <Dialog header='额外成本管理' visible={visible} onClose={onClose} width={700} footer={false}>
      {/* 汇总信息 */}
      <div className='mb-4 flex items-center justify-between rounded bg-gray-50 p-3'>
        <span className='text-gray-600'>额外成本合计</span>
        <span className='text-lg font-semibold text-primary'>¥{totalAmount.toFixed(2)}</span>
      </div>

      {/* 添加表单 */}
      <Form ref={formRef} layout='inline' className='mb-4'>
        <FormItem label='金额' name='amount' rules={[{ required: true, message: '请输入金额' }]}>
          <InputNumber placeholder='金额' min={0} decimalPlaces={2} suffix='元' style={{ width: 150 }} />
        </FormItem>
        <FormItem label='描述' name='description'>
          <Input placeholder='请输入描述（选填）' style={{ width: 200 }} />
        </FormItem>
        <FormItem>
          <Button theme='primary' onClick={handleAdd} loading={addLoading}>
            添加
          </Button>
        </FormItem>
      </Form>

      {/* 成本列表 */}
      <Table
        data={extraCosts}
        columns={columns}
        rowKey='id'
        size='small'
        bordered
        maxHeight={300}
        empty='暂无额外成本'
      />

      {/* 底部按钮 */}
      <div className='mt-4 flex justify-end'>
        <Button variant='outline' onClick={onClose}>
          关闭
        </Button>
      </div>
    </Dialog>
  );
};

export default memo(ExtraCostModal);
