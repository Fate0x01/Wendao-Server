import React, { memo, useEffect, useState } from 'react';
import api from 'services';
import { Dialog, Loading, MessagePlugin, Select } from 'tdesign-react';

export interface SelectMemberModalProps {
  /** 弹窗可见状态 */
  visible: boolean;
  /** 目标部门 ID */
  departmentId: string;
  /** 目标部门名称 */
  departmentName: string;
  /** 当前部门已有成员（用于过滤） */
  existingMemberIds: string[];
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 提交成功回调 */
  onSuccess: () => void;
}

/**
 * 选择已有成员弹窗
 * 从当前用户管辖范围内的成员中选择添加到部门
 */
const SelectMemberModal: React.FC<SelectMemberModalProps> = ({
  visible,
  departmentId,
  departmentName,
  existingMemberIds,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 获取可选成员列表（排除当前部门已有成员）
  useEffect(() => {
    const fetchAvailableMembers = async () => {
      if (!visible) return;
      setLoading(true);
      try {
        // 获取用户列表（后端会根据权限返回可管辖的用户）
        const res = await api.sysUserControllerGetUsers({ current: 1, pageSize: 1000 });
        const users = res.data?.list ?? [];
        // 过滤掉当前部门已有的成员
        const availableUsers = users.filter((u) => !existingMemberIds.includes(u.id));
        setOptions(availableUsers.map((u) => ({ label: u.username, value: u.id })));
      } catch (err) {
        console.error('获取用户列表失败:', err);
        MessagePlugin.error('获取用户列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableMembers();
  }, [visible, existingMemberIds]);

  // 关闭弹窗
  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  // 提交
  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      MessagePlugin.warning('请选择要添加的成员');
      return;
    }

    setSubmitting(true);
    try {
      await api.sysDeptControllerLinkMember({
        departmentId,
        userIds: selectedIds,
      });
      MessagePlugin.success('添加成员成功');
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('添加成员失败:', err);
      MessagePlugin.error('添加成员失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      header='选择已有成员'
      width={500}
      confirmBtn={{ content: '确定', loading: submitting }}
      cancelBtn='取消'
      onConfirm={handleSubmit}
      onClose={handleClose}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, color: 'var(--td-text-color-secondary)' }}>
        选择成员添加到部门：<strong>{departmentName}</strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Loading />
        </div>
      ) : (
        <Select
          value={selectedIds}
          onChange={(val) => setSelectedIds(val as string[])}
          options={options}
          placeholder='请选择成员（支持多选）'
          multiple
          filterable
          style={{ width: '100%' }}
          empty={options.length === 0 ? '暂无可添加的成员' : undefined}
        />
      )}
    </Dialog>
  );
};

export default memo(SelectMemberModal);
