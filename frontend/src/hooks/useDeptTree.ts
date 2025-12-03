import { useCallback, useEffect, useMemo, useState } from 'react';
import api from 'services';
import type { DeptTreeEntity } from 'services/generated/model';
import { useUserInfo } from 'stores/auth';

/**
 * 用户部门角色类型
 */
export type DeptRole = 'level1Leader' | 'level2Leader' | 'member';

/**
 * 部门树节点（用于 TreeSelect）
 */
export interface DeptTreeNode {
  value: string;
  label: string;
  children?: DeptTreeNode[];
}

export interface UseDeptTreeReturn {
  /** 用户角色 */
  role: DeptRole;
  /** 是否为负责人（一级或二级） */
  isLeader: boolean;
  /** 可选部门树数据（用于 TreeSelect） */
  deptTreeData: DeptTreeNode[];
  /** 用户所属部门ID */
  userDeptId: string | null;
  /** 加载状态 */
  loading: boolean;
  /** 刷新部门树 */
  refresh: () => Promise<void>;
}

/**
 * 将后端部门树转换为 TreeSelect 需要的格式
 */
const transformToTreeSelectData = (nodes: DeptTreeEntity[]): DeptTreeNode[] => {
  return nodes.map((node) => ({
    value: node.id,
    label: node.name,
    children:
      node.children && node.children.length > 0
        ? transformToTreeSelectData(node.children as DeptTreeEntity[])
        : undefined,
  }));
};

/**
 * 在部门树中查找用户所在部门的层级
 * @returns 0: 未找到, 1: 一级部门, 2: 二级部门, 3+: 更深层级
 */
const findDeptLevel = (nodes: DeptTreeEntity[], deptId: string, level = 1): number => {
  for (const node of nodes) {
    if (node.id === deptId) {
      return level;
    }
    if (node.children && node.children.length > 0) {
      const found = findDeptLevel(node.children as DeptTreeEntity[], deptId, level + 1);
      if (found > 0) return found;
    }
  }
  return 0;
};

/**
 * 部门树 Hook
 * 获取部门树数据，并根据用户角色控制部门筛选的展示和默认值
 */
export const useDeptTree = (): UseDeptTreeReturn => {
  const [treeData, setTreeData] = useState<DeptTreeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const userProfile = useUserInfo();

  // 获取部门树数据
  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.sysDeptControllerGetDeptTree();
      setTreeData(res.data ?? []);
    } catch (error) {
      console.error('获取部门树失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // 转换为 TreeSelect 格式
  const deptTreeData = useMemo(() => transformToTreeSelectData(treeData), [treeData]);

  // 用户所属部门ID（从 userProfile 获取，这里简化处理）
  const userDeptId = useMemo(() => {
    // TODO: 从用户信息中获取部门ID
    return null;
  }, [userProfile]);

  // 判断用户角色
  const role = useMemo<DeptRole>(() => {
    if (!userDeptId || treeData.length === 0) {
      // 默认当作负责人处理，可以看到所有部门
      return 'level1Leader';
    }
    const level = findDeptLevel(treeData, userDeptId);
    if (level === 1) return 'level1Leader';
    if (level === 2) return 'level2Leader';
    return 'member';
  }, [treeData, userDeptId]);

  // 是否为负责人
  const isLeader = role === 'level1Leader' || role === 'level2Leader';

  return {
    role,
    isLeader,
    deptTreeData,
    userDeptId,
    loading,
    refresh: fetchTree,
  };
};

export default useDeptTree;
