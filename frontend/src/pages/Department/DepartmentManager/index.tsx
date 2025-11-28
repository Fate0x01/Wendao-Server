import React, { memo, useCallback, useState } from 'react';
import type { DeptDetailEntity, DeptTreeEntity } from 'services/generated/model';
import { AddIcon, FolderIcon, RefreshIcon } from 'tdesign-icons-react';
import { Button, Divider } from 'tdesign-react';
import DeptDetail from './components/DeptDetail';
import DeptFormModal from './components/DeptFormModal';
import DeptTree from './components/DeptTree';
import MemberList from './components/MemberList';
import { useDeptTree } from './hooks/useDeptTree';

/**
 * 部门管理页面
 * 左侧部门树 + 右侧部门详情/成员列表
 */
const DepartmentManager: React.FC = () => {
  const { treeData, loading, refresh } = useDeptTree();
  const [selectedDept, setSelectedDept] = useState<DeptTreeEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editData, setEditData] = useState<DeptDetailEntity | null>(null);

  // 选中部门
  const handleSelect = useCallback((dept: DeptTreeEntity | null) => {
    setSelectedDept(dept);
  }, []);

  // 新建部门
  const handleAdd = useCallback(() => {
    setEditData(null);
    setFormVisible(true);
  }, []);

  // 编辑部门
  const handleEdit = useCallback((dept: DeptDetailEntity) => {
    setEditData(dept);
    setFormVisible(true);
  }, []);

  // 关闭弹窗
  const handleCloseForm = useCallback(() => {
    setFormVisible(false);
    setEditData(null);
  }, []);

  // 保存成功后刷新
  const handleSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  // 删除成功后清除选中并刷新
  const handleDeleted = useCallback(() => {
    setSelectedDept(null);
    refresh();
  }, [refresh]);

  return (
    <div className='flex h-full gap-4 overflow-hidden'>
      {/* 左侧部门树 */}
      <div className='flex w-[280px] min-w-[280px] flex-col overflow-hidden rounded-[var(--td-radius-medium)] bg-[var(--td-bg-color-container)] p-4 shadow-sm'>
        <div className='mb-3 flex items-center justify-between pb-3'>
          <span className='text-sm font-medium text-[var(--td-text-color-primary)]'>部门列表</span>
          <div className='flex gap-1'>
            <Button variant='text' shape='square' icon={<RefreshIcon />} onClick={refresh} loading={loading} />
          </div>
        </div>
        <div className='flex-1 overflow-auto'>
          <DeptTree data={treeData} loading={loading} selectedId={selectedDept?.id} onSelect={handleSelect} />
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className='flex flex-1 flex-col overflow-hidden rounded-[var(--td-radius-medium)] bg-[var(--td-bg-color-container)] p-6 shadow-sm'>
        {/* 工具栏 */}
        <div className='mb-4 flex-shrink-0'>
          <Button theme='primary' icon={<AddIcon />} onClick={handleAdd}>
            新建部门
          </Button>
        </div>

        <div className='flex-1 overflow-auto'>
          {selectedDept ? (
            <div className='flex flex-col gap-6'>
              {/* 部门详情 */}
              <DeptDetail deptId={selectedDept.id} onEdit={handleEdit} onDeleted={handleDeleted} />
              <Divider className='!my-0' />
              {/* 成员列表摘要 */}
              <MemberList deptId={selectedDept.id} />
            </div>
          ) : (
            <div className='flex h-full flex-col items-center justify-center text-[var(--td-text-color-placeholder)]'>
              <FolderIcon className='mb-4 text-5xl opacity-50' />
              <span>请在左侧选择一个部门查看详情</span>
            </div>
          )}
        </div>
      </div>

      {/* 新建/编辑部门弹窗 */}
      <DeptFormModal
        visible={formVisible}
        editData={editData}
        treeData={treeData}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default memo(DepartmentManager);
