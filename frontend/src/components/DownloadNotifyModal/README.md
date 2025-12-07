# DownloadNotifyModal 下载通知弹窗组件

用于处理长时间下载任务，避免浏览器阻止下载的公共组件。

## 功能特性

- ✅ 支持长时间下载任务，避免浏览器阻止下载
- ✅ 下载过程中显示加载动画
- ✅ 下载完成后弹窗提醒用户保存文件
- ✅ 使用 `browser-fs-access` 的 `fileSave` 保存文件
- ✅ 支持错误处理和重试
- ✅ 提供 Hook 方式使用

## 基础用法

### 方式一：直接使用组件

```tsx
import { useState } from 'react';
import DownloadNotifyModal from 'components/DownloadNotifyModal';
import api from 'services';

function MyComponent() {
  const [visible, setVisible] = useState(false);

  const handleDownload = async () => {
    // 调用 API 获取 Blob
    const response = await fetch('/api/download');
    const blob = await response.blob();
    return blob;
  };

  return (
    <>
      <button onClick={() => setVisible(true)}>下载文件</button>
      <DownloadNotifyModal
        visible={visible}
        downloadFn={handleDownload}
        defaultFileName="example.xlsx"
        downloadText="正在下载文件，请稍候..."
        saveText="文件已准备就绪，请点击保存按钮保存文件"
        onClose={() => setVisible(false)}
        onSuccess={(blob) => {
          console.log('下载成功', blob);
        }}
        onError={(error) => {
          console.error('下载失败', error);
        }}
      />
    </>
  );
}
```

### 方式二：使用 Hook

```tsx
import { useDownloadNotify } from 'components/DownloadNotifyModal';
import api from 'services';

function MyComponent() {
  const { startDownload, DownloadModal } = useDownloadNotify();

  const handleDownload = async () => {
    startDownload({
      downloadFn: async () => {
        // 调用 API 获取 Blob
        const response = await fetch('/api/download');
        return await response.blob();
      },
      defaultFileName: 'example.xlsx',
      downloadText: '正在下载文件，请稍候...',
      saveText: '文件已准备就绪，请点击保存按钮保存文件',
    });
  };

  return (
    <>
      <button onClick={handleDownload}>下载文件</button>
      <DownloadModal />
    </>
  );
}
```

### 方式三：结合 API 服务使用

```tsx
import { useDownloadNotify } from 'components/DownloadNotifyModal';
import api from 'services';

function MyComponent() {
  const { startDownload, DownloadModal } = useDownloadNotify();

  const handleExport = () => {
    startDownload({
      downloadFn: async () => {
        // 假设 API 返回 Blob
        const response = await api.sysStockControllerExportStock({
          // ... 参数
        });
        // 如果 API 返回的是 Response，需要转换为 Blob
        if (response instanceof Response) {
          return await response.blob();
        }
        // 如果已经是 Blob，直接返回
        return response;
      },
      defaultFileName: '库存报表.xlsx',
    });
  };

  return (
    <>
      <button onClick={handleExport}>导出库存报表</button>
      <DownloadModal />
    </>
  );
}
```

## API

### DownloadNotifyModal Props

| 属性 | 说明 | 类型 | 默认值 | 必填 |
|------|------|------|--------|------|
| downloadFn | 下载函数，返回 Promise<Blob> | `() => Promise<Blob>` | - | 是 |
| defaultFileName | 默认文件名 | `string` | `'download'` | 否 |
| downloadText | 下载提示文本 | `string` | `'正在下载文件，请稍候...'` | 否 |
| saveText | 保存提示文本 | `string` | `'文件已准备就绪，请点击保存按钮保存文件'` | 否 |
| visible | 是否显示组件（用于受控模式） | `boolean` | - | 否 |
| onClose | 关闭回调 | `() => void` | - | 否 |
| onSuccess | 下载成功回调 | `(blob: Blob) => void` | - | 否 |
| onError | 下载失败回调 | `(error: Error) => void` | - | 否 |
| autoDownload | 是否在 visible 变为 true 时自动开始下载 | `boolean` | `true` | 否 |

### useDownloadNotify Hook

返回对象：

| 属性 | 说明 | 类型 |
|------|------|------|
| startDownload | 开始下载 | `(config: DownloadConfig) => void` |
| close | 关闭弹窗 | `() => void` |
| DownloadModal | 下载弹窗组件 | `() => React.ReactElement \| null` |

## 注意事项

1. **下载函数必须返回 Blob**：确保 `downloadFn` 返回的是 `Promise<Blob>`
2. **浏览器兼容性**：`browser-fs-access` 需要现代浏览器支持
3. **文件扩展名**：`defaultFileName` 应包含文件扩展名，如 `'report.xlsx'`
4. **错误处理**：组件会自动处理下载错误，并提供重试功能

## 实现原理

该组件解决了浏览器在长时间下载任务中可能阻止下载的问题：

1. 用户点击下载按钮后，立即显示弹窗
2. 在弹窗中执行下载函数，保持用户交互上下文
3. 下载过程中显示加载动画
4. 下载完成后，使用 `fileSave` 弹窗提醒用户保存文件
5. 由于整个过程都在用户交互上下文中，浏览器不会阻止下载

