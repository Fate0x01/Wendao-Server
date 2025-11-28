import React, { memo, useEffect, useState } from 'react';
import { Button, Loading, Table, Tag } from 'tdesign-react';
import { ChevronRightIcon } from 'tdesign-icons-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import { useNavigate } from 'react-router-dom';
import api from 'services';
import type { DeptMemberEntity } from 'services/generated/model';

export interface MemberListProps {
  /** 部门 ID */
  deptId: string;
  /** 最大显示数量 */
  maxCount?: number;
}

/** 成员列表表格列配置 */
const columns: PrimaryTableCol<DeptMemberEntity>[] = [
  { title: '用户名', colKey: 'username', width: 120 },
  {
    title: '状态',
    colKey: 'disabled',
    width: 80,
    cell: ({ row }) => (
      <Tag theme={row.disabled ? 'danger' : 'success'} variant='light' size='small'>
        {row.disabled ? '禁用' : '正常'}
      </Tag>
    ),
  },
  {
    title: '角色',
    colKey: 'isLeader',
    width: 80,
    cell: ({ row }) =>
      row.isLeader ? (
        <Tag theme='primary' variant='light' size='small'>
          负责人
        </Tag>
      ) : (
        <span style={{ color: 'var(--td-text-color-secondary)' }}>成员</span>
      ),
  },
];

/**
 * 嵌入式成员列表组件
 * 在部门详情中展示成员摘要
 */
const MemberList: React.FC<MemberListProps> = ({ deptId, maxCount = 5 }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<DeptMemberEntity[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await api.sysDeptControllerGetDeptMembers({
          departmentId: deptId,
          current: 1,
          pageSize: maxCount,
        });
        setMembers(res.data?.list ?? []);
        setTotal(res.data?.total ?? 0);
      } catch (err) {
        console.error('获取成员列表失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (deptId) {
      fetchMembers();
    }
  }, [deptId, maxCount]);

  const handleViewAll = () => {
    navigate(`/department/members?deptId=${deptId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>成员列表（{total} 人）</h4>
        {total > maxCount && (
          <Button variant='text' theme='primary' suffix={<ChevronRightIcon />} onClick={handleViewAll}>
            查看全部
          </Button>
        )}
      </div>

      {members.length > 0 ? (
        <Table
          data={members}
          columns={columns}
          rowKey='id'
          size='small'
          bordered
          stripe
          pagination={false}
          loading={loading}
        />
      ) : (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--td-text-color-placeholder)' }}>暂无成员</div>
      )}
    </div>
  );
};

export default memo(MemberList);

