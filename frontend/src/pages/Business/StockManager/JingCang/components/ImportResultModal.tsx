import React, { memo } from 'react';
import type { StockImportResultEntity } from 'services/generated/model';
import { CheckCircleFilledIcon, CloseCircleFilledIcon, ErrorCircleFilledIcon } from 'tdesign-icons-react';
import { Button, Dialog, Tag } from 'tdesign-react';

interface ImportResultModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 导入结果数据 */
  result: StockImportResultEntity | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 导入结果展示弹窗组件
 */
const ImportResultModal: React.FC<ImportResultModalProps> = ({ visible, result, onClose }) => {
  if (!result) return null;

  const hasErrors = result.fail > 0;
  const isAllSuccess = result.fail === 0 && result.success > 0;
  const isAllFail = result.success === 0 && result.fail > 0;

  return (
    <Dialog
      header='导入结果'
      visible={visible}
      onClose={onClose}
      width={600}
      footer={
        <Button theme='primary' onClick={onClose}>
          确定
        </Button>
      }
    >
      {/* 结果统计 */}
      <div className='mb-4 flex items-center gap-6 rounded-lg bg-gray-50 p-4'>
        <div className='flex items-center gap-2'>
          {isAllSuccess ? (
            <CheckCircleFilledIcon className='text-2xl text-green-600' />
          ) : isAllFail ? (
            <CloseCircleFilledIcon className='text-2xl text-red-600' />
          ) : (
            <ErrorCircleFilledIcon className='text-2xl text-warning' />
          )}
          <span className='text-base'>{isAllSuccess ? '导入成功' : isAllFail ? '导入失败' : '部分导入成功'}</span>
        </div>
        <div className='flex gap-4'>
          <div className='flex items-center gap-1'>
            <Tag theme='success' variant='light'>
              成功
            </Tag>
            <span className='text-lg font-semibold'>{result.success}</span>
            <span className='text-gray-500'>条</span>
          </div>
          <div className='flex items-center gap-1'>
            <Tag theme='danger' variant='light'>
              失败
            </Tag>
            <span className='text-lg font-semibold'>{result.fail}</span>
            <span className='text-gray-500'>条</span>
          </div>
        </div>
      </div>

      {/* 错误信息列表 */}
      {hasErrors && result.errors.length > 0 && (
        <div>
          <div className='mb-2 text-sm font-medium text-gray-700'>错误详情：</div>
          <div className='max-h-[300px] overflow-auto rounded border border-gray-200'>
            {result.errors.map((error, index) => (
              <div key={index} className='flex items-start gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0'>
                <span className='flex-shrink-0 text-gray-400'>{index + 1}.</span>
                <span className='text-sm text-red-600'>{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default memo(ImportResultModal);
