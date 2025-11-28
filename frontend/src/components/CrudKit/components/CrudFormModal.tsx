import React, { memo } from 'react';
import { Dialog, Form } from 'tdesign-react';
import type { CrudFormModalProps } from '../types';

/**
 * CRUD 表单弹窗组件
 * 通用表单弹窗壳，支持 renderForm 自定义内容
 */
const CrudFormModal: React.FC<CrudFormModalProps> = ({
  title,
  visible,
  isEdit,
  formRef,
  loading = false,
  width = 500,
  onClose,
  onSubmit,
  onOpened,
  renderForm,
  labelWidth = 80,
}) => {
  return (
    <Dialog
      header={isEdit ? title.edit : title.add}
      visible={visible}
      onClose={onClose}
      onConfirm={onSubmit}
      onOpened={onOpened}
      confirmBtn='确认'
      width={width}
      confirmLoading={loading}
    >
      <Form ref={formRef} labelWidth={labelWidth} colon>
        {renderForm(isEdit)}
      </Form>
    </Dialog>
  );
};

export default memo(CrudFormModal);

