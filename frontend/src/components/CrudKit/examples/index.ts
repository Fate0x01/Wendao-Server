/**
 * CrudKit 示例文件导出
 *
 * 使用方式：
 * 1. 根据业务场景选择合适的示例文件
 * 2. 复制到 src/pages/YourModule/ 目录
 * 3. 按需修改类型定义、API、配置等
 *
 * 示例说明：
 * - CrudPageExample: 标准 CRUD 页面（配置化），适合增删改查完整功能
 * - QueryOnlyExample: 仅查询页面（含导出），适合日志、记录类展示
 * - CustomModalExample: 自定义弹窗表单，适合复杂表单或自定义操作
 * - BatchOperationExample: 批量操作页面，适合需要多选批量处理的场景
 */

// 注意：示例文件不建议直接导入使用，请复制到业务目录后修改
export { default as BatchOperationExample } from './BatchOperationExample';
export { default as CrudPageExample } from './CrudPageExample';
export { default as CustomModalExample } from './CustomModalExample';
export { default as QueryOnlyExample } from './QueryOnlyExample';
