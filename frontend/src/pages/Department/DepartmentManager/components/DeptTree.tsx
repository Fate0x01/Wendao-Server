import React, { memo, useMemo, useState } from 'react';
import type { DeptTreeEntity } from 'services/generated/model';
import { SearchIcon } from 'tdesign-icons-react';
import type { TreeNodeModel } from 'tdesign-react';
import { Input, Tag, Tree } from 'tdesign-react';

export interface DeptTreeProps {
  /** 部门树数据 */
  data: DeptTreeEntity[];
  /** 加载状态 */
  loading?: boolean;
  /** 选中的部门 ID */
  selectedId?: string;
  /** 选中部门时的回调 */
  onSelect?: (dept: DeptTreeEntity | null) => void;
}

/** Tree 组件字段映射 */
const TREE_KEYS = { value: 'id', label: 'name', children: 'children' };

/**
 * 过滤树节点（按名称搜索）
 */
const filterTree = (data: DeptTreeEntity[], keyword: string): DeptTreeEntity[] => {
  if (!keyword) return data;
  const lowerKeyword = keyword.toLowerCase();

  return data
    .map((dept) => {
      const children = dept.children ? filterTree(dept.children as DeptTreeEntity[], keyword) : [];
      const nameMatch = dept.name.toLowerCase().includes(lowerKeyword);

      if (nameMatch || children.length > 0) {
        return { ...dept, children: children.length > 0 ? children : dept.children };
      }
      return null;
    })
    .filter(Boolean) as DeptTreeEntity[];
};

/**
 * 获取所有节点 ID（用于展开）
 */
const getAllNodeIds = (data: DeptTreeEntity[]): string[] => {
  const keys: string[] = [];
  const traverse = (items: DeptTreeEntity[]) => {
    items.forEach((item) => {
      keys.push(item.id);
      if (item.children) {
        traverse(item.children as DeptTreeEntity[]);
      }
    });
  };
  traverse(data);
  return keys;
};

/**
 * 部门树组件
 * 支持搜索过滤、禁用状态可视化、节点选中交互
 */
const DeptTree: React.FC<DeptTreeProps> = ({ data, loading, selectedId, onSelect }) => {
  const [searchValue, setSearchValue] = useState('');

  // 过滤后的树数据
  const filteredData = useMemo(() => filterTree(data, searchValue), [data, searchValue]);

  // 默认展开所有节点
  const expandedKeys = useMemo(() => getAllNodeIds(data), [data]);

  // 节点点击处理
  const handleClick = (context: { node: TreeNodeModel<DeptTreeEntity> }) => {
    const dept = context.node.data as DeptTreeEntity;
    onSelect?.(dept);
  };

  // 自定义节点渲染
  const renderLabel = (node: TreeNodeModel<DeptTreeEntity>) => {
    const dept = node.data as DeptTreeEntity;
    if (!dept) return null;
    const isDisabled = dept.disabled;

    return (
      <div className='flex w-full items-center gap-2'>
        <span
          className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
            isDisabled ? 'text-[var(--td-text-color-disabled)] opacity-60' : ''
          }`}
        >
          {dept.name}
        </span>
        {isDisabled && (
          <Tag size='small' theme='default' variant='light' className='scale-85 text-[10px]'>
            已禁用
          </Tag>
        )}
      </div>
    );
  };

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex-shrink-0'>
        <Input
          placeholder='搜索部门'
          prefixIcon={<SearchIcon />}
          value={searchValue}
          onChange={(value) => setSearchValue(value as string)}
          clearable
        />
      </div>
      <div className='flex-1 overflow-auto'>
        <Tree
          data={filteredData}
          keys={TREE_KEYS}
          loading={loading}
          expandAll
          defaultExpanded={expandedKeys}
          activable
          activeMultiple={false}
          actived={selectedId ? [selectedId] : []}
          onClick={handleClick}
          label={renderLabel}
          empty='暂无部门数据'
        />
      </div>
    </div>
  );
};

export default memo(DeptTree);
