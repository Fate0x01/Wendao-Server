import _ from 'lodash';
import React, { memo, useEffect, useMemo, useState } from 'react';
import api from 'services';
import type { PermissionEntity } from 'services/generated/model';
import { Loading, MessagePlugin, Tree } from 'tdesign-react';

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
}

export interface PermissionTreeProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}

/**
 * 将扁平权限列表转换为树形结构
 * 按 group 字段分组
 */
const transformPermissionsToTree = (permissions: PermissionEntity[]): TreeNode[] => {
  const groups = _.groupBy(permissions, 'group');
  return Object.entries(groups).map(([group, items]) => ({
    label: group,
    value: `group-${group}`,
    children: items.map((p) => ({
      label: p.name,
      value: p.id,
    })),
  }));
};

/**
 * 从 value 中过滤出有效的权限 ID（排除 group 前缀）
 */
const filterValidPermissionIds = (values: string[]): string[] => {
  return values.filter((v) => !v.startsWith('group-'));
};

const PermissionTree: React.FC<PermissionTreeProps> = ({ value = [], onChange }) => {
  const [permissions, setPermissions] = useState<PermissionEntity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await api.sysRoleControllerGetPermissions();
        setPermissions(res.data || []);
      } catch (error) {
        MessagePlugin.error('获取权限列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // 转换为树形数据
  const treeData = useMemo(() => {
    return transformPermissionsToTree(permissions);
  }, [permissions]);

  // 处理选中变化
  const handleChange = (checkedValues: (string | number)[]) => {
    // 过滤出有效的权限 ID
    const validIds = filterValidPermissionIds(checkedValues as string[]);
    onChange?.(validIds);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Tree
      data={treeData}
      checkable
      expandAll
      hover
      value={value}
      onChange={handleChange}
      style={{ maxHeight: 300, minWidth: 200, overflow: 'auto' }}
    />
  );
};

export default memo(PermissionTree);
