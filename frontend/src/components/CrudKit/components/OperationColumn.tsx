import React, { memo, useCallback } from 'react';
import { Button, Popconfirm } from 'tdesign-react';
import type { ActionConfig, OperationColumnProps } from '../types';

/**
 * 操作列渲染组件
 * 支持自定义按钮组合，含确认弹窗
 */
function OperationColumnInner<TData>({
  record,
  actions,
  extra,
}: OperationColumnProps<TData>): React.ReactElement {
  // 渲染单个操作按钮
  const renderAction = useCallback(
    (action: ActionConfig<TData>) => {
      const { key, label, danger, confirm, onClick, disabled, hidden } = action;

      // 判断是否隐藏
      const isHidden = typeof hidden === 'function' ? hidden(record) : hidden;
      if (isHidden) return null;

      // 判断是否禁用
      const isDisabled = typeof disabled === 'function' ? disabled(record) : disabled;

      // 点击处理
      const handleClick = () => {
        onClick?.(record);
      };

      const button = (
        <Button
          key={key}
          theme={danger ? 'danger' : 'primary'}
          variant='text'
          disabled={isDisabled}
          onClick={confirm ? undefined : handleClick}
        >
          {label}
        </Button>
      );

      // 带确认弹窗
      if (confirm) {
        return (
          <Popconfirm key={key} content={confirm} onConfirm={handleClick}>
            {button}
          </Popconfirm>
        );
      }

      return button;
    },
    [record],
  );

  return (
    <>
      {actions.map(renderAction)}
      {extra}
    </>
  );
}

// 使用泛型的 memo 包装
const OperationColumn = memo(OperationColumnInner) as typeof OperationColumnInner;

export default OperationColumn;

