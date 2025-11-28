import { useCallback, useEffect, useState } from 'react';
import api from 'services';
import type { DeptTreeEntity } from 'services/generated/model';

export interface UseDeptTreeReturn {
  /** 部门树数据 */
  treeData: DeptTreeEntity[];
  /** 加载状态 */
  loading: boolean;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 错误信息 */
  error: string | null;
}

/**
 * 部门树数据管理 Hook
 * 负责获取部门树数据、管理加载状态和刷新功能
 */
export const useDeptTree = (): UseDeptTreeReturn => {
  const [treeData, setTreeData] = useState<DeptTreeEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.sysDeptControllerGetDeptTree();
      setTreeData(res.data ?? []);
    } catch (err) {
      setError('获取部门树失败');
      console.error('获取部门树失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    treeData,
    loading,
    refresh: fetchTree,
    error,
  };
};

export default useDeptTree;

