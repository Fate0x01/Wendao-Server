import Show from 'components/Show';
import dayjs from 'dayjs';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from 'services';
import type { DeptMemberEntity, DeptTreeEntity } from 'services/generated/model';
import { AddIcon, RefreshIcon, SearchIcon } from 'tdesign-icons-react';
import type { DropdownOption } from 'tdesign-react';
import { Button, Dropdown, Input, MessagePlugin, Popconfirm, Table, Tag } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import DeptTree from '../DepartmentManager/components/DeptTree';
import { useDeptTree } from '../DepartmentManager/hooks/useDeptTree';
import AddMemberModal from './components/AddMemberModal';
import SelectMemberModal from './components/SelectMemberModal';

/**
 * 成员管理页面
 * 左侧部门树筛选器 + 右侧成员列表
 */
const MemberManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDeptId = searchParams.get('deptId') || '';

  const { treeData, loading: treeLoading, refresh: refreshTree } = useDeptTree();
  const [selectedDept, setSelectedDept] = useState<DeptTreeEntity | null>(null);
  const [members, setMembers] = useState<DeptMemberEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keywords, setKeywords] = useState('');

  // 添加成员弹窗状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);

  // 初始化时根据 URL 参数选中部门
  useEffect(() => {
    if (initialDeptId && treeData.length > 0 && !selectedDept) {
      const findDept = (data: DeptTreeEntity[]): DeptTreeEntity | null => {
        for (const item of data) {
          if (item.id === initialDeptId) return item;
          if (item.children) {
            const found = findDept(item.children as DeptTreeEntity[]);
            if (found) return found;
          }
        }
        return null;
      };
      const dept = findDept(treeData);
      if (dept) {
        setSelectedDept(dept);
      }
    }
  }, [initialDeptId, treeData, selectedDept]);

  // 获取成员列表
  const fetchMembers = useCallback(async () => {
    if (!selectedDept) return;
    setLoading(true);
    try {
      const res = await api.sysDeptControllerGetDeptMembers({
        departmentId: selectedDept.id,
        current,
        pageSize,
        keywords: keywords || undefined,
      });
      setMembers(res.data?.list ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      console.error('获取成员列表失败:', err);
      MessagePlugin.error('获取成员列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDept, current, pageSize, keywords]);

  // 部门变化或分页变化时获取数据
  useEffect(() => {
    if (selectedDept) {
      fetchMembers();
    } else {
      setMembers([]);
      setTotal(0);
    }
  }, [selectedDept, current, pageSize, fetchMembers]);

  // 选中部门
  const handleSelect = useCallback((dept: DeptTreeEntity | null) => {
    setSelectedDept(dept);
    setCurrent(1);
    setKeywords('');
  }, []);

  // 搜索
  const handleSearch = useCallback(() => {
    setCurrent(1);
    fetchMembers();
  }, [fetchMembers]);

  // 设为负责人
  const handleSetLeader = useCallback(
    async (member: DeptMemberEntity) => {
      if (!selectedDept) return;
      try {
        // 获取当前所有负责人
        const currentLeaders = members.filter((m) => m.isLeader).map((m) => m.id);
        // 添加新负责人
        await api.sysDeptControllerSetLeaders({
          departmentId: selectedDept.id,
          leaderIds: [...currentLeaders, member.id],
        });
        MessagePlugin.success('设置成功');
        fetchMembers();
      } catch (err) {
        console.error('设置负责人失败:', err);
        MessagePlugin.error('设置负责人失败');
      }
    },
    [selectedDept, members, fetchMembers],
  );

  // 取消负责人
  const handleCancelLeader = useCallback(
    async (member: DeptMemberEntity) => {
      if (!selectedDept) return;
      try {
        // 获取当前所有负责人，移除目标成员
        const currentLeaders = members.filter((m) => m.isLeader && m.id !== member.id).map((m) => m.id);
        await api.sysDeptControllerSetLeaders({
          departmentId: selectedDept.id,
          leaderIds: currentLeaders,
        });
        MessagePlugin.success('取消成功');
        fetchMembers();
      } catch (err) {
        console.error('取消负责人失败:', err);
        MessagePlugin.error('取消负责人失败');
      }
    },
    [selectedDept, members, fetchMembers],
  );

  // 移除成员
  const handleRemove = useCallback(
    async (member: DeptMemberEntity) => {
      if (!selectedDept) return;
      try {
        await api.sysDeptControllerRemoveMember({
          departmentId: selectedDept.id,
          userId: member.id,
        });
        MessagePlugin.success('移除成功');
        fetchMembers();
      } catch (err) {
        console.error('移除成员失败:', err);
        MessagePlugin.error('移除成员失败');
      }
    },
    [selectedDept, fetchMembers],
  );

  // 表格列配置
  const columns: PrimaryTableCol<DeptMemberEntity>[] = useMemo(
    () => [
      { title: '用户名', colKey: 'username', width: 150 },
      {
        title: '状态',
        colKey: 'disabled',
        width: 100,
        cell: ({ row }) => (
          <Tag theme={row.disabled ? 'danger' : 'success'} variant='light'>
            {row.disabled ? '禁用' : '正常'}
          </Tag>
        ),
      },
      {
        title: '角色',
        colKey: 'isLeader',
        width: 100,
        cell: ({ row }) =>
          row.isLeader ? (
            <Tag theme='primary' variant='light'>
              负责人
            </Tag>
          ) : (
            <span style={{ color: 'var(--td-text-color-secondary)' }}>成员</span>
          ),
      },
      {
        title: '创建时间',
        colKey: 'createdAt',
        width: 180,
        cell: ({ row }) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: '操作',
        colKey: 'operation',
        width: 180,
        cell: ({ row }) => (
          <>
            <Show permission='dept:setLeaders'>
              {row.isLeader ? (
                <Button variant='text' theme='primary' onClick={() => handleCancelLeader(row)}>
                  取消负责人
                </Button>
              ) : (
                <Button variant='text' theme='primary' onClick={() => handleSetLeader(row)}>
                  设为负责人
                </Button>
              )}
            </Show>
            <Popconfirm content='确定要将该成员从部门中移除吗？' onConfirm={() => handleRemove(row)}>
              <Button variant='text' theme='danger'>
                移除
              </Button>
            </Popconfirm>
          </>
        ),
      },
    ],
    [handleSetLeader, handleCancelLeader, handleRemove],
  );

  // 添加成员下拉菜单
  const addDropdownOptions: DropdownOption[] = [
    { content: '新建账号', value: 'create' },
    { content: '选择已有成员', value: 'select' },
  ];

  const handleAddDropdownClick = (data: DropdownOption) => {
    if (data.value === 'create') {
      setAddModalVisible(true);
    } else if (data.value === 'select') {
      setSelectModalVisible(true);
    }
  };

  // 已有成员 ID 列表
  const existingMemberIds = useMemo(() => members.map((m) => m.id), [members]);

  return (
    <div className='flex h-full gap-4 overflow-hidden'>
      {/* 左侧部门树 */}
      <div className='flex w-[280px] min-w-[280px] flex-col overflow-hidden rounded-[var(--td-radius-medium)] bg-[var(--td-bg-color-container)] p-4 shadow-sm'>
        <div className='mb-3 flex items-center justify-between pb-3'>
          <span className='text-sm font-medium text-[var(--td-text-color-primary)]'>选择部门</span>
        </div>
        <div className='flex-1 overflow-auto'>
          <DeptTree data={treeData} loading={treeLoading} selectedId={selectedDept?.id} onSelect={handleSelect} />
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className='flex flex-1 flex-col overflow-hidden rounded-[var(--td-radius-medium)] bg-[var(--td-bg-color-container)] p-6 shadow-sm'>
        {/* 工具栏 */}
        <div className='mb-4 flex flex-shrink-0 items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Dropdown options={addDropdownOptions} onClick={handleAddDropdownClick} disabled={!selectedDept}>
              <Button theme='primary' icon={<AddIcon />} disabled={!selectedDept}>
                添加成员
              </Button>
            </Dropdown>
            <Button variant='outline' icon={<RefreshIcon />} onClick={fetchMembers} disabled={!selectedDept}>
              刷新
            </Button>
            {selectedDept && (
              <span className='ml-2 text-sm text-[var(--td-text-color-secondary)]'>
                当前部门：
                <span className='font-medium text-[var(--td-text-color-primary)]'>{selectedDept.name}</span>
              </span>
            )}
          </div>
          <div>
            <Input
              placeholder='搜索用户名'
              prefixIcon={<SearchIcon />}
              value={keywords}
              onChange={(val) => setKeywords(val as string)}
              onEnter={handleSearch}
              style={{ width: 200 }}
              disabled={!selectedDept}
            />
          </div>
        </div>

        {/* 成员列表 */}
        <div className='flex-1 overflow-auto'>
          {selectedDept ? (
            <Table
              data={members}
              columns={columns}
              rowKey='id'
              loading={loading}
              stripe
              bordered
              pagination={{
                current,
                pageSize,
                total,
                onChange: (pageInfo) => {
                  setCurrent(pageInfo.current);
                  setPageSize(pageInfo.pageSize);
                },
              }}
            />
          ) : (
            <div className='flex h-full flex-col items-center justify-center text-[var(--td-text-color-placeholder)]'>
              <span>请在左侧选择一个部门查看成员</span>
            </div>
          )}
        </div>
      </div>

      {/* 添加新成员弹窗 */}
      {selectedDept && (
        <AddMemberModal
          visible={addModalVisible}
          departmentId={selectedDept.id}
          departmentName={selectedDept.name}
          onClose={() => setAddModalVisible(false)}
          onSuccess={() => {
            fetchMembers();
            refreshTree();
          }}
        />
      )}

      {/* 选择已有成员弹窗 */}
      {selectedDept && (
        <SelectMemberModal
          visible={selectModalVisible}
          departmentId={selectedDept.id}
          departmentName={selectedDept.name}
          existingMemberIds={existingMemberIds}
          onClose={() => setSelectModalVisible(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
};

export default memo(MemberManager);
