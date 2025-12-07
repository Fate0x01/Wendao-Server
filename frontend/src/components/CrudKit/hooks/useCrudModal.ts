import { useCallback, useRef, useState } from 'react';
import { MessagePlugin } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react/es/form/type';
import type { UseCrudModalOptions, UseCrudModalReturn } from '../types';

/**
 * CRUD 弹窗状态管理 Hook
 * 管理弹窗状态：新增/编辑模式、表单数据填充、提交逻辑
 */
export function useCrudModal<TData, TCreateDto = unknown, TUpdateDto = unknown>(
  options: UseCrudModalOptions<TData, TCreateDto, TUpdateDto> = {},
): UseCrudModalReturn<TData> {
  const {
    createApi,
    updateApi,
    onSuccess,
    successMessage = { create: '创建成功', update: '更新成功' },
    errorMessage = { create: '创建失败', update: '更新失败' },
  } = options;

  const [visible, setVisible] = useState(false);
  const [editData, setEditData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormInstanceFunctions>(null);

  const isEdit = !!editData;

  // 打开新增弹窗
  const openAdd = useCallback(() => {
    setEditData(null);
    setVisible(true);
  }, []);

  // 打开编辑弹窗
  const openEdit = useCallback((record: TData) => {
    setEditData(record);
    setVisible(true);
  }, []);

  // 关闭弹窗
  const close = useCallback(() => {
    setVisible(false);
    setEditData(null);
  }, []);

  // 提交处理
  const handleSubmit = useCallback(
    async <TFormValues>(transformFn?: (values: TFormValues, isEdit: boolean, editData: TData | null) => unknown) => {
      // 表单校验
      const validateResult = await formRef.current?.validate?.();
      if (validateResult !== true) return;

      // 获取表单值
      const formValues = formRef.current?.getFieldsValue?.(true) as TFormValues;

      // 转换表单值
      const submitData = transformFn ? transformFn(formValues, isEdit, editData) : formValues;

      setLoading(true);
      try {
        if (isEdit && updateApi) {
          await updateApi(submitData as TUpdateDto);
          MessagePlugin.success(successMessage.update || '更新成功');
        } else if (!isEdit && createApi) {
          await createApi(submitData as TCreateDto);
          MessagePlugin.success(successMessage.create || '创建成功');
        }
        close();
        onSuccess?.();
      } catch (error: any) {
        console.error('提交失败:', error);
        const defaultMsg = isEdit ? errorMessage.update || '更新失败' : errorMessage.create || '创建失败';
        MessagePlugin.error(error?.msg || defaultMsg);
      } finally {
        setLoading(false);
      }
    },
    [isEdit, editData, createApi, updateApi, successMessage, errorMessage, close, onSuccess],
  );

  return {
    visible,
    editData,
    isEdit,
    formRef,
    loading,
    openAdd,
    openEdit,
    close,
    handleSubmit,
  };
}

export default useCrudModal;
