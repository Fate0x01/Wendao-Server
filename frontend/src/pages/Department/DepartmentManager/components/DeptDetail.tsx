import React, { memo, useEffect, useState } from 'react';
import { Button, Descriptions, Divider, Loading, MessagePlugin, Popconfirm, Space, Tag } from 'tdesign-react';
import { EditIcon, DeleteIcon, UserIcon } from 'tdesign-icons-react';
import dayjs from 'dayjs';
import api from 'services';
import type { DeptDetailEntity, DeptMemberEntity } from 'services/generated/model';
import { useNavigate } from 'react-router-dom';

export interface DeptDetailProps {
  /** 部门 ID */
  deptId: string;
  /** 编辑按钮点击回调 */
  onEdit?: (dept: DeptDetailEntity) => void;
  /** 删除成功回调 */
  onDeleted?: () => void;
  /** 是否可编辑 */
  canEdit?: boolean;
  /** 是否可删除 */
  canDelete?: boolean;
}

/**
 * 部门详情面板
 * 展示部门基本信息、负责人列表、成员数量等
 */
const DeptDetail: React.FC<DeptDetailProps> = ({ deptId, onEdit, onDeleted, canEdit = true, canDelete = true }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DeptDetailEntity | null>(null);
  const [leaders, setLeaders] = useState<DeptMemberEntity[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // 获取部门详情
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [detailRes, membersRes] = await Promise.all([
          api.sysDeptControllerGetDept(deptId),
          api.sysDeptControllerGetDeptMembers({ departmentId: deptId, current: 1, pageSize: 100 }),
        ]);
        setDetail(detailRes.data ?? null);
        const members = membersRes.data?.list ?? [];
        setLeaders(members.filter((m) => m.isLeader));
        setMemberCount(membersRes.data?.total ?? 0);
      } catch (err) {
        console.error('获取部门详情失败:', err);
        MessagePlugin.error('获取部门详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (deptId) {
      fetchDetail();
    }
  }, [deptId]);

  // 删除部门
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.sysDeptControllerDeleteDept(deptId);
      MessagePlugin.success('删除成功');
      onDeleted?.();
    } catch (err) {
      console.error('删除部门失败:', err);
      MessagePlugin.error('删除部门失败');
    } finally {
      setDeleting(false);
    }
  };

  // 跳转到成员管理
  const handleViewMembers = () => {
    navigate(`/department/members?deptId=${deptId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loading />
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0 }}>{detail.name}</h3>
        <Space>
          <Button variant='outline' icon={<UserIcon />} onClick={handleViewMembers}>
            查看成员
          </Button>
          {canEdit && (
            <Button variant='outline' icon={<EditIcon />} onClick={() => onEdit?.(detail)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm content='确定要删除该部门吗？删除后不可恢复。' onConfirm={handleDelete}>
              <Button variant='outline' theme='danger' icon={<DeleteIcon />} loading={deleting}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Descriptions column={2} itemStyle={{ marginBottom: 16 }}>
        <Descriptions.DescriptionsItem label='部门名称'>{detail.name}</Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='部门状态'>
          <Tag theme={detail.disabled ? 'danger' : 'success'} variant='light'>
            {detail.disabled ? '已禁用' : '正常'}
          </Tag>
        </Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='父级部门'>{detail.parent?.name ?? '-'}</Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='成员数量'>{memberCount} 人</Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='创建时间'>
          {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='更新时间'>
          {dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.DescriptionsItem>
        <Descriptions.DescriptionsItem label='部门描述' span={2}>
          {detail.description || '-'}
        </Descriptions.DescriptionsItem>
      </Descriptions>

      <Divider />

      <div>
        <h4 style={{ marginBottom: 12 }}>负责人</h4>
        {leaders.length > 0 ? (
          <Space>
            {leaders.map((leader) => (
              <Tag key={leader.id} theme='primary' variant='light'>
                {leader.username}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: 'var(--td-text-color-placeholder)' }}>暂无负责人</span>
        )}
      </div>
    </div>
  );
};

export default memo(DeptDetail);

