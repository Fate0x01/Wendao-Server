import React, { memo } from 'react';
import { Button, Space } from 'tdesign-react';
import type { CrudToolbarProps, ToolbarActionConfig } from '../types';

/**
 * CRUD 工具栏组件
 * 支持新增、导入、导出、批量操作等按钮
 */
const CrudToolbar: React.FC<CrudToolbarProps> = ({
  primaryAction,
  extraActions,
  batchActions,
  selectedCount = 0,
}) => {
  // 渲染操作按钮
  const renderActionButton = (action: ToolbarActionConfig) => (
    <Button
      key={action.key}
      theme={action.danger ? 'danger' : 'default'}
      variant='outline'
      disabled={action.disabled}
      onClick={action.onClick}
      icon={action.icon}
    >
      {action.label}
    </Button>
  );

  // 是否显示批量操作
  const showBatchActions = batchActions && batchActions.length > 0 && selectedCount > 0;

  return (
    <div className='mb-4 flex items-center justify-between'>
      <Space>
        {/* 主操作按钮 */}
        {primaryAction && (
          <Button theme='primary' onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}

        {/* 额外操作按钮 */}
        {extraActions?.map(renderActionButton)}

        {/* 批量操作按钮 */}
        {showBatchActions && (
          <>
            <span className='text-gray-500'>已选 {selectedCount} 项</span>
            {batchActions.map(renderActionButton)}
          </>
        )}
      </Space>
    </div>
  );
};

export default memo(CrudToolbar);

