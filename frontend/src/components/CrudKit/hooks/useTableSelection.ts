import { useCallback, useState } from 'react';
import type { UseTableSelectionReturn } from '../types';

/**
 * 表格多选状态管理 Hook
 * 管理表格多选状态，支持批量操作场景
 */
export function useTableSelection<TData>(): UseTableSelectionReturn<TData> {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<TData[]>([]);

  // 选择变化处理
  const handleSelectionChange = useCallback(
    (keys: string[], context: { selectedRowData: TData[] }) => {
      setSelectedRowKeys(keys);
      setSelectedRows(context.selectedRowData);
    },
    [],
  );

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, []);

  return {
    selectedRowKeys,
    selectedRows,
    setSelectedRowKeys,
    handleSelectionChange,
    clearSelection,
  };
}

export default useTableSelection;

