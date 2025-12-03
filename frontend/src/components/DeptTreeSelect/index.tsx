/**
 * 部门树选择器组件
 * 全局公用组件，用于部门选择场景
 */
import { useDeptTree, type DeptTreeNode } from 'hooks/useDeptTree';
import React, { memo } from 'react';
import type { TreeSelectProps } from 'tdesign-react';
import { TreeSelect } from 'tdesign-react';

export interface DeptTreeSelectProps extends Omit<TreeSelectProps, 'data'> {
  /** 外部传入的部门树数据（可选，不传则自动获取） */
  deptTreeData?: DeptTreeNode[];
}

/**
 * 部门树选择器
 * 支持两种使用方式：
 * 1. 自动获取：不传 deptTreeData，组件内部自动获取部门树
 * 2. 外部传入：传入 deptTreeData，使用外部数据
 */
const DeptTreeSelect: React.FC<DeptTreeSelectProps> = ({ deptTreeData: externalData, ...restProps }) => {
  const { deptTreeData: internalData, loading } = useDeptTree();

  // 优先使用外部传入的数据
  const data = externalData ?? internalData;

  return (
    <TreeSelect
      data={data}
      placeholder='请选择部门'
      clearable
      filterable
      loading={loading && !externalData}
      {...restProps}
    />
  );
};

export default memo(DeptTreeSelect);

// 导出 hook 和类型，方便外部复用
export { useDeptTree, type DeptTreeNode, type UseDeptTreeReturn } from 'hooks/useDeptTree';
