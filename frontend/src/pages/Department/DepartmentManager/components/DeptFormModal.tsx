import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Form, Input, Switch, Textarea, TreeSelect, MessagePlugin } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react';
import api from 'services';
import type { DeptDetailEntity, DeptTreeEntity } from 'services/generated/model';

const { FormItem } = Form;

export interface DeptFormModalProps {
  /** 弹窗可见状态 */
  visible: boolean;
  /** 编辑数据（新增时为 null） */
  editData: DeptDetailEntity | null;
  /** 部门树数据（用于选择父部门） */
  treeData: DeptTreeEntity[];
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 提交成功回调 */
  onSuccess: () => void;
}

/**
 * 将部门树转换为 TreeSelect 数据格式
 */
const transformTreeSelectData = (data: DeptTreeEntity[], excludeId?: string): any[] => {
  return data
    .filter((d) => d.id !== excludeId) // 排除当前编辑的部门
    .map((dept) => ({
      value: dept.id,
      label: dept.name,
      // 只允许选择一级部门作为父部门（二级部门不能有子部门）
      children: undefined,
    }));
};

/**
 * 部门表单弹窗
 * 用于创建和编辑部门
 */
const DeptFormModal: React.FC<DeptFormModalProps> = ({ visible, editData, treeData, onClose, onSuccess }) => {
  const formRef = useRef<FormInstanceFunctions>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;

  // 父部门选项（只显示一级部门）
  const parentOptions = useMemo(() => {
    // 一级部门：parentId 为 null
    const firstLevelDepts = treeData.filter((d) => !d.parentId);
    return transformTreeSelectData(firstLevelDepts, editData?.id);
  }, [treeData, editData?.id]);

  // 弹窗打开时填充表单
  useEffect(() => {
    if (visible && editData) {
      setTimeout(() => {
        formRef.current?.setFieldsValue({
          name: editData.name,
          description: editData.description || '',
          parentId: editData.parentId || undefined,
          disabled: editData.disabled,
        });
      }, 0);
    }
  }, [visible, editData]);

  // 弹窗关闭时重置表单
  const handleClose = () => {
    formRef.current?.reset();
    onClose();
  };

  // 提交表单
  const handleSubmit = async () => {
    const validateResult = await formRef.current?.validate();
    if (validateResult !== true) return;

    const values = formRef.current?.getFieldsValue(true) as Record<string, any>;
    setLoading(true);

    try {
      if (isEdit) {
        await api.sysDeptControllerUpdateDept({
          id: editData.id,
          name: values.name,
          description: values.description || undefined,
          disabled: values.disabled,
        });
        MessagePlugin.success('更新成功');
      } else {
        await api.sysDeptControllerCreateDept({
          name: values.name,
          description: values.description || undefined,
          parentId: values.parentId || undefined,
          disabled: values.disabled,
        });
        MessagePlugin.success('创建成功');
      }
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('保存部门失败:', err);
      MessagePlugin.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      header={isEdit ? '编辑部门' : '新建部门'}
      width={500}
      confirmBtn={{ content: '确定', loading }}
      cancelBtn='取消'
      onConfirm={handleSubmit}
      onClose={handleClose}
      destroyOnClose
    >
      <Form ref={formRef} labelWidth={100} labelAlign='right'>
        <FormItem
          label='部门名称'
          name='name'
          rules={[
            { required: true, message: '请输入部门名称' },
            { min: 2, message: '部门名称至少2个字符' },
            { max: 32, message: '部门名称最多32个字符' },
          ]}
        >
          <Input placeholder='请输入部门名称' />
        </FormItem>

        <FormItem label='部门描述' name='description'>
          <Textarea placeholder='请输入部门描述' maxlength={200} />
        </FormItem>

        <FormItem label='父级部门' name='parentId'>
          <TreeSelect
            data={parentOptions}
            placeholder='不选择则为一级部门'
            clearable
            disabled={isEdit} // 编辑时不允许修改父部门
          />
        </FormItem>

        <FormItem label='是否禁用' name='disabled' initialData={false}>
          <Switch customValue={[true, false]} label={['禁用', '正常']} />
        </FormItem>
      </Form>
    </Dialog>
  );
};

export default memo(DeptFormModal);

