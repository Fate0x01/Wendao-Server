import React, { useCallback, useMemo } from 'react';
import { Card, MessagePlugin, Table } from 'tdesign-react';
import type { PrimaryTableCol } from 'tdesign-react/es/table';
import { useCrudModal, useCrudTable, useTableSelection } from '../hooks';
import type { ActionConfig, CrudPageProps, PaginationParams } from '../types';
import CrudFormModal from './CrudFormModal';
import CrudSearchForm from './CrudSearchForm';
import CrudToolbar from './CrudToolbar';
import OperationColumn from './OperationColumn';

/**
 * CRUD 页面组件
 * 一个配置对象生成完整 CRUD 页面
 */
function CrudPage<
  TData extends { id: string },
  TFilters extends PaginationParams = PaginationParams,
  TCreateDto = unknown,
  TUpdateDto = unknown,
>({
  api,
  searchFields,
  columns,
  formConfig,
  toolbar,
  operations,
  hideOperations = false,
  rowSelection = false,
  batchActions,
  defaultFilters,
  defaultPageSize = 10,
  rowKey = 'id',
  deleteConfirmText = '确定删除该记录？',
}: CrudPageProps<TData, TFilters, TCreateDto, TUpdateDto>): React.ReactElement {
  // 表格状态
  const {
    list,
    total,
    loading,
    filters,
    refresh,
    handleSearch,
    handleReset,
    handlePageChange,
  } = useCrudTable<TData, TFilters>({
    fetchApi: api.list,
    defaultFilters,
    defaultPageSize,
  });

  // 弹窗状态
  const {
    visible,
    editData,
    isEdit,
    formRef,
    loading: modalLoading,
    openAdd,
    openEdit,
    close,
    handleSubmit,
  } = useCrudModal<TData, TCreateDto, TUpdateDto>({
    createApi: api.create,
    updateApi: api.update,
    onSuccess: refresh,
  });

  // 多选状态
  const {
    selectedRowKeys,
    handleSelectionChange,
    clearSelection,
  } = useTableSelection<TData>();

  // 删除处理
  const handleDelete = useCallback(
    async (record: TData) => {
      if (!api.delete) return;
      try {
        await api.delete(record.id);
        MessagePlugin.success('删除成功');
        refresh();
      } catch (error) {
        console.error('删除失败:', error);
        MessagePlugin.error('删除失败');
      }
    },
    [api.delete, refresh],
  );

  // 表单提交处理
  const onFormSubmit = useCallback(() => {
    handleSubmit((values: Record<string, unknown>) => {
      if (formConfig?.transformValues) {
        return formConfig.transformValues(values, isEdit, editData);
      }
      // 默认行为：编辑时带上 id
      if (isEdit && editData) {
        return { ...values, id: editData.id };
      }
      return values;
    });
  }, [handleSubmit, formConfig, isEdit, editData]);

  // 弹窗打开后填充表单
  const handleDialogOpened = useCallback(() => {
    if (editData && formConfig?.fillForm) {
      const formData = formConfig.fillForm(editData);
      formRef.current?.setFieldsValue(formData);
    } else if (editData) {
      // 默认行为：直接使用 editData 填充
      formRef.current?.setFieldsValue(editData as Record<string, unknown>);
    } else {
      formRef.current?.reset?.();
    }
  }, [editData, formConfig, formRef]);

  // 构建操作列
  const operationColumn = useMemo<PrimaryTableCol<TData> | null>(() => {
    if (hideOperations) return null;

    // 默认操作
    const defaultActions: ActionConfig<TData>[] = [];

    // 编辑按钮（如果有更新 API 或自定义表单）
    if (api.update || formConfig) {
      defaultActions.push({
        key: 'edit',
        label: '编辑',
        onClick: openEdit,
      });
    }

    // 删除按钮（如果有删除 API）
    if (api.delete) {
      defaultActions.push({
        key: 'delete',
        label: '删除',
        danger: true,
        confirm: deleteConfirmText,
        onClick: handleDelete,
      });
    }

    // 合并自定义操作
    const finalActions = operations
      ? operations.map((op) => {
          // 处理内置操作
          if (op.key === 'edit' && !op.onClick) {
            return { ...op, onClick: openEdit };
          }
          if (op.key === 'delete' && !op.onClick) {
            return { ...op, onClick: handleDelete, confirm: op.confirm || deleteConfirmText };
          }
          return op;
        })
      : defaultActions;

    if (finalActions.length === 0) return null;

    return {
      title: '操作',
      colKey: 'operation',
      fixed: 'right',
      width: Math.max(100, finalActions.length * 60),
      cell: ({ row }) => <OperationColumn record={row} actions={finalActions} />,
    };
  }, [hideOperations, operations, api.update, api.delete, formConfig, openEdit, handleDelete, deleteConfirmText]);

  // 合并列配置
  const finalColumns = useMemo(() => {
    const cols = [...columns];
    if (operationColumn) {
      cols.push(operationColumn);
    }
    return cols;
  }, [columns, operationColumn]);

  // 表格选择配置
  const rowSelectionConfig = useMemo(
    () =>
      rowSelection
        ? {
            selectedRowKeys,
            onSelectChange: handleSelectionChange,
          }
        : undefined,
    [rowSelection, selectedRowKeys, handleSelectionChange],
  );

  return (
    <div className='flex min-h-full flex-col gap-4'>
      {/* 搜索区域 */}
      {searchFields && searchFields.length > 0 && (
        <Card bordered={false}>
          <CrudSearchForm
            fields={searchFields}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </Card>
      )}

      {/* 表格区域 */}
      <Card bordered={false}>
        {/* 工具栏 */}
        {(toolbar || batchActions) && (
          <CrudToolbar
            primaryAction={
              !toolbar?.hidePrimary && (api.create || formConfig)
                ? { label: toolbar?.primaryLabel || '新增', onClick: openAdd }
                : undefined
            }
            extraActions={toolbar?.extra}
            batchActions={batchActions}
            selectedCount={selectedRowKeys.length}
          />
        )}

        {/* 表格 */}
        <Table
          loading={loading}
          data={list}
          columns={finalColumns}
          rowKey={rowKey}
          hover
          selectOnRowClick={rowSelection}
          selectedRowKeys={rowSelectionConfig?.selectedRowKeys}
          onSelectChange={rowSelectionConfig?.onSelectChange}
          pagination={{
            current: filters.current,
            pageSize: filters.pageSize,
            total,
            showJumper: true,
          }}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* 表单弹窗 */}
      {formConfig && (
        <CrudFormModal
          title={formConfig.title}
          visible={visible}
          isEdit={isEdit}
          formRef={formRef}
          loading={modalLoading}
          width={formConfig.width}
          onClose={close}
          onSubmit={onFormSubmit}
          onOpened={handleDialogOpened}
          renderForm={(edit) => formConfig.renderForm(edit, editData)}
        />
      )}
    </div>
  );
}

export default CrudPage;

