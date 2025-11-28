import React, { memo, useRef, useState } from 'react';
import { Dialog, Form, Input, Switch, MessagePlugin } from 'tdesign-react';
import type { FormInstanceFunctions } from 'tdesign-react';
import api from 'services';

const { FormItem } = Form;

export interface AddMemberModalProps {
  /** 弹窗可见状态 */
  visible: boolean;
  /** 目标部门 ID */
  departmentId: string;
  /** 目标部门名称 */
  departmentName: string;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 提交成功回调 */
  onSuccess: () => void;
}

/**
 * 添加新成员弹窗
 * 创建新用户账号并关联到指定部门
 */
const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  departmentId,
  departmentName,
  onClose,
  onSuccess,
}) => {
  const formRef = useRef<FormInstanceFunctions>(null);
  const [loading, setLoading] = useState(false);

  // 关闭弹窗
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
      await api.sysDeptControllerAddMember({
        username: values.username,
        password: values.password,
        departmentId,
        isLeader: values.isLeader ?? false,
      });
      MessagePlugin.success('添加成功');
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('添加成员失败:', err);
      MessagePlugin.error('添加成员失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      header='添加新成员'
      width={500}
      confirmBtn={{ content: '确定', loading }}
      cancelBtn='取消'
      onConfirm={handleSubmit}
      onClose={handleClose}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, color: 'var(--td-text-color-secondary)' }}>
        将新建用户账号并添加到部门：<strong>{departmentName}</strong>
      </div>
      <Form ref={formRef} labelWidth={100} labelAlign='right'>
        <FormItem
          label='用户名'
          name='username'
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '用户名至少2个字符' },
            { max: 16, message: '用户名最多16个字符' },
          ]}
        >
          <Input placeholder='请输入用户名' />
        </FormItem>

        <FormItem
          label='密码'
          name='password'
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
            { max: 16, message: '密码最多16个字符' },
          ]}
        >
          <Input type='password' placeholder='请输入密码' />
        </FormItem>

        <FormItem label='设为负责人' name='isLeader' initialData={false}>
          <Switch customValue={[true, false]} label={['是', '否']} />
        </FormItem>
      </Form>
    </Dialog>
  );
};

export default memo(AddMemberModal);

