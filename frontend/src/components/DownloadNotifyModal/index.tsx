import { fileSave } from 'browser-fs-access';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DownloadIcon, ErrorCircleIcon } from 'tdesign-icons-react';
import { Button, Dialog, Loading } from 'tdesign-react';

export interface DownloadNotifyModalProps {
  /**
   * 下载函数，返回 Promise<Blob>
   */
  downloadFn: () => Promise<Blob>;
  /**
   * 默认文件名
   */
  defaultFileName?: string;
  /**
   * 下载提示文本
   */
  downloadText?: string;
  /**
   * 保存提示文本
   */
  saveText?: string;
  /**
   * 是否显示组件（用于受控模式）
   */
  visible?: boolean;
  /**
   * 关闭回调
   */
  onClose?: () => void;
  /**
   * 下载成功回调
   */
  onSuccess?: (blob: Blob) => void;
  /**
   * 下载失败回调
   */
  onError?: (error: Error) => void;
  /**
   * 是否在 visible 变为 true 时自动开始下载
   */
  autoDownload?: boolean;
}

/**
 * 下载通知弹窗组件
 * 用于处理长时间下载任务，避免浏览器阻止下载
 */
const DownloadNotifyModal: React.FC<DownloadNotifyModalProps> = ({
  downloadFn,
  defaultFileName = 'download',
  downloadText = '正在下载文件，请稍候...',
  saveText = '文件已准备就绪，请点击保存按钮保存文件',
  visible: controlledVisible,
  onClose,
  onSuccess,
  onError,
  autoDownload = true,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasDownloadedRef = useRef(false);

  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  /**
   * 执行下载
   */
  const handleDownload = useCallback(async () => {
    if (hasDownloadedRef.current) return;

    setLoading(true);
    setError(null);
    setBlob(null);
    hasDownloadedRef.current = true;

    try {
      const result = await downloadFn();
      setBlob(result);
      setLoading(false);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '下载失败';
      setError(errorMessage);
      setLoading(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      hasDownloadedRef.current = false;
    }
  }, [downloadFn, onSuccess, onError]);

  /**
   * 保存文件
   */
  const handleSave = useCallback(async () => {
    if (!blob) return;

    try {
      const fileExtension = defaultFileName.split('.').pop() || '';
      await fileSave(blob, {
        fileName: defaultFileName,
        extensions: fileExtension ? [`.${fileExtension}`] : [],
      });
      setInternalVisible(false);
      setBlob(null);
      setError(null);
      setLoading(false);
      hasDownloadedRef.current = false;
      onClose?.();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('保存文件失败:', err);
        setError('保存文件失败，请重试');
      }
    }
  }, [blob, defaultFileName, onClose]);

  /**
   * 关闭弹窗
   */
  const handleClose = useCallback(() => {
    setInternalVisible(false);
    setBlob(null);
    setError(null);
    setLoading(false);
    hasDownloadedRef.current = false;
    onClose?.();
  }, [onClose]);

  /**
   * 开始下载流程
   */
  const startDownload = useCallback(() => {
    setInternalVisible(true);
    if (autoDownload) {
      handleDownload();
    }
  }, [autoDownload, handleDownload]);

  // 当 visible 变为 true 且 autoDownload 为 true 时，自动开始下载
  useEffect(() => {
    if (isVisible && autoDownload && !hasDownloadedRef.current) {
      handleDownload();
    }
  }, [isVisible, autoDownload, handleDownload]);

  // 重置状态当 visible 变为 false
  useEffect(() => {
    if (!isVisible) {
      hasDownloadedRef.current = false;
    }
  }, [isVisible]);

  return (
    <Dialog
      visible={isVisible}
      onClose={handleClose}
      header='文件下载'
      width={480}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {blob && (
            <Button theme='primary' onClick={handleSave} icon={<DownloadIcon />}>
              保存文件
            </Button>
          )}
          <Button onClick={handleClose}>{blob ? '关闭' : '取消'}</Button>
        </div>
      }
      closeOnEscKeydown
      closeOnOverlayClick={!loading}
    >
      <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loading size='large' loading={true} text={downloadText}>
              <div style={{ width: '100%', height: '100px' }} />
            </Loading>
          </div>
        )}

        {!loading && blob && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#0052d9' }}>
              <DownloadIcon />
            </div>
            <div style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>{saveText}</div>
            <div style={{ fontSize: '14px', color: '#999' }}>文件名: {defaultFileName}</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#d54941' }}>
              <ErrorCircleIcon />
            </div>
            <div style={{ fontSize: '16px', color: '#d54941', marginBottom: '8px' }}>下载失败</div>
            <div style={{ fontSize: '14px', color: '#999' }}>{error}</div>
            <Button
              theme='primary'
              variant='outline'
              size='small'
              onClick={handleDownload}
              style={{ marginTop: '16px' }}
            >
              重试
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default DownloadNotifyModal;

/**
 * Hook: 使用下载通知弹窗
 */
export const useDownloadNotify = () => {
  const [visible, setVisible] = useState(false);
  const [downloadConfig, setDownloadConfig] = useState<{
    downloadFn: () => Promise<Blob>;
    defaultFileName?: string;
    downloadText?: string;
    saveText?: string;
  } | null>(null);

  const startDownload = useCallback(
    (config: {
      downloadFn: () => Promise<Blob>;
      defaultFileName?: string;
      downloadText?: string;
      saveText?: string;
    }) => {
      setDownloadConfig(config);
      setVisible(true);
    },
    [],
  );

  const close = useCallback(() => {
    setVisible(false);
    setDownloadConfig(null);
  }, []);

  const DownloadModal = useCallback(
    () =>
      downloadConfig ? (
        <DownloadNotifyModal
          visible={visible}
          downloadFn={downloadConfig.downloadFn}
          defaultFileName={downloadConfig.defaultFileName}
          downloadText={downloadConfig.downloadText}
          saveText={downloadConfig.saveText}
          onClose={close}
        />
      ) : null,
    [downloadConfig, visible, close],
  );

  return {
    startDownload,
    close,
    DownloadModal,
  };
};
