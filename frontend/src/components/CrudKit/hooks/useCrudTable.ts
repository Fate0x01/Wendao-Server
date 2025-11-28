import { useCallback, useEffect, useState } from 'react';
import { MessagePlugin } from 'tdesign-react';
import type { PaginationParams, UseCrudTableOptions, UseCrudTableReturn } from '../types';

/**
 * CRUD 表格状态管理 Hook
 * 管理表格核心状态：分页、筛选、数据获取、刷新
 */
export function useCrudTable<TData, TFilters extends PaginationParams = PaginationParams>(
  options: UseCrudTableOptions<TData, TFilters>,
): UseCrudTableReturn<TData, TFilters> {
  const { fetchApi, defaultFilters, defaultPageSize = 10 } = options;

  // 初始筛选条件
  const initialFilters = {
    current: 1,
    pageSize: defaultPageSize,
    ...defaultFilters,
  } as TFilters;

  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [list, setList] = useState<TData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(filters);
      setList(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error('获取列表数据失败:', error);
      MessagePlugin.error('获取列表数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchApi, filters]);

  // 监听 filters 变化自动获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 刷新数据
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 搜索处理（重置到第一页）
  const handleSearch = useCallback((values: Partial<TFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
      current: 1,
    }));
  }, []);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // 分页变化处理
  const handlePageChange = useCallback((pageInfo: { current: number; pageSize: number }) => {
    setFilters((prev) => ({
      ...prev,
      current: pageInfo.current,
      pageSize: pageInfo.pageSize,
    }));
  }, []);

  return {
    list,
    total,
    loading,
    filters,
    setFilters,
    refresh,
    handleSearch,
    handleReset,
    handlePageChange,
  };
}

export default useCrudTable;

