# PRD: 部门管理模块

## 1. 概述

基于树状分权模型，实现后端部门管理模块，支持固定两级部门结构（一级部门、二级部门），提供部门 CRUD、成员管理、部门树查询等功能。该模块是系统权限体系的核心组成部分，实现逐级放权的管理模式。

---

## 2. 目标

1. 实现固定两级部门结构（一级部门由超管创建，二级部门由一级部门管理员创建）
2. 支持用户多部门归属
3. 支持部门多负责人机制
4. 提供完整的部门 CRUD 接口
5. 提供部门成员管理接口
6. 提供部门树结构查询接口
7. 实现基于 CASL 的数据权限控制

---

## 3. 用户故事

### 超级管理员

- 作为超级管理员，我可以创建一级部门，以便构建组织架构顶层框架
- 作为超级管理员，我可以为一级部门指定负责人，以便将管理权授予该负责人
- 作为超级管理员，我可以查看所有部门的完整树结构

### 一级部门管理员

- 作为一级部门管理员，我可以在本部门下创建二级部门
- 作为一级部门管理员，我可以为二级部门指定负责人
- 作为一级部门管理员，我只能看到和管理本部门及其子部门

### 二级部门负责人

- 作为二级部门负责人，我可以在本部门下添加普通成员
- 作为二级部门负责人，我可以管理本部门的成员列表
- 作为二级部门负责人，我只能看到本部门的信息和成员

---

## 4. 功能需求

### 4.1 数据模型设计

#### Department 模型

| 字段        | 类型          | 说明                         |
| ----------- | ------------- | ---------------------------- |
| id          | String (CUID) | 主键                         |
| createdAt   | DateTime      | 创建时间                     |
| updatedAt   | DateTime      | 更新时间                     |
| name        | String        | 部门名称                     |
| description | String?       | 部门描述（可选）             |
| disabled    | Boolean       | 禁用状态，默认 false         |
| parentId    | String?       | 父部门 ID（一级部门为 null） |
| createdById | String?       | 创建人 ID                    |

#### 关联关系

| 关系      | 类型         | 说明                         |
| --------- | ------------ | ---------------------------- |
| parent    | Department?  | 父部门（自关联）             |
| children  | Department[] | 子部门列表                   |
| members   | User[]       | 部门成员（多对多隐式关联）   |
| leaders   | User[]       | 部门负责人（多对多隐式关联） |
| createdBy | User?        | 创建人                       |

#### User 模型扩展

需在 User 模型中添加以下关联字段：

| 关系               | 类型         | 说明           |
| ------------------ | ------------ | -------------- |
| departments        | Department[] | 所属部门列表   |
| leadingDepartments | Department[] | 负责的部门列表 |
| createdDepartments | Department[] | 创建的部门列表 |

### 4.2 部门管理接口

| 序号 | 接口             | 方法   | 说明             |
| ---- | ---------------- | ------ | ---------------- |
| 1    | /sys-dept/create | POST   | 创建部门         |
| 2    | /sys-dept/update | POST   | 更新部门信息     |
| 3    | /sys-dept/:id    | GET    | 获取部门详情     |
| 4    | /sys-dept/:id    | DELETE | 删除部门         |
| 5    | /sys-dept/list   | POST   | 分页查询部门列表 |
| 6    | /sys-dept/tree   | GET    | 获取部门树结构   |

### 4.3 成员管理接口

| 序号 | 接口                    | 方法 | 说明                     |
| ---- | ----------------------- | ---- | ------------------------ |
| 1    | /sys-dept/members       | POST | 查询部门成员列表         |
| 2    | /sys-dept/add-member    | POST | 添加部门成员（创建账号） |
| 3    | /sys-dept/remove-member | POST | 移除部门成员             |
| 4    | /sys-dept/set-leaders   | POST | 设置部门负责人           |

#### 添加成员接口说明

`/sys-dept/add-member` 接口需要同时完成：

1. **创建用户账号**：包含 username、password 字段
2. **关联到指定部门**：包含 departmentId 字段
3. **自动分配角色**：根据操作者身份和目标部门层级自动分配对应角色

入参字段：

| 字段         | 类型    | 必填 | 说明                         |
| ------------ | ------- | ---- | ---------------------------- |
| username     | String  | 是   | 用户名                       |
| password     | String  | 是   | 密码                         |
| departmentId | String  | 是   | 目标部门 ID                  |
| isLeader     | Boolean | 否   | 是否设为负责人（默认 false） |

### 4.4 业务规则

1. **层级限制**：

   - 一级部门的 parentId 必须为 null
   - 二级部门的 parentId 必须指向一级部门
   - 不允许创建三级及以上部门

2. **创建权限**：

   - 超管可创建一级部门
   - 一级部门负责人可创建本部门下的二级部门
   - 二级部门负责人不可创建部门

3. **成员管理**：

   - 超管可管理所有部门成员
   - 一级部门负责人可管理本部门及子部门成员
   - 二级部门负责人可管理本部门成员
   - 普通成员创建后自动归属于创建者所在的二级部门，无法变更

4. **负责人机制**：

   - 每个部门可有多个负责人
   - 负责人必须是该部门的成员
   - 负责人拥有该部门的管理权限

5. **禁用逻辑**：

   - 禁用部门后，该部门及其子部门下的成员权限受限
   - 禁用一级部门会影响其所有子部门

### 4.5 角色分配规则

基于 `BaseRole` 枚举，添加成员时根据操作者身份和目标部门自动分配角色：

| 操作者角色                | 目标部门 | 分配角色                              | 说明                           |
| ------------------------- | -------- | ------------------------------------- | ------------------------------ |
| SUPER_ADMIN               | 一级部门 | DEPARTMENT_LEADER                     | 超管为一级部门添加负责人       |
| SUPER_ADMIN               | 二级部门 | DEPARTMENT_LEADER / DEPARTMENT_MEMBER | 超管可指定是否为负责人         |
| DEPARTMENT_LEADER（一级） | 二级部门 | DEPARTMENT_LEADER                     | 一级负责人为二级部门添加负责人 |
| DEPARTMENT_LEADER（二级） | 本部门   | DEPARTMENT_MEMBER                     | 二级负责人添加普通成员         |

**角色枚举说明**（`BaseRole`）：

```prisma
enum BaseRole {
    SUPER_ADMIN        // 超级管理员（系统初始化创建，唯一）
    NORMAL_ADMIN       // 普通管理员（保留，暂不使用）
    DEPARTMENT_LEADER  // 部门负责人（一级/二级部门负责人）
    DEPARTMENT_MEMBER  // 部门成员（普通业务操作人员）
}
```

**分配逻辑**：

1. 超管添加成员到一级部门 → 自动分配 `DEPARTMENT_LEADER`
2. 一级部门负责人添加成员到二级部门 → 自动分配 `DEPARTMENT_LEADER`
3. 二级部门负责人添加成员到本部门 → 自动分配 `DEPARTMENT_MEMBER`
4. 通过 `isLeader` 参数可将已有成员提升为负责人

### 4.6 CASL 数据权限策略

需在 `casl-ability.factory.ts` 中新增 `handleDepartmentAbility` 函数：

```typescript
function handleDepartmentAbility(
  builder: AbilityBuilder<AppAbility>,
  user: ReqUser
) {
  // 获取用户负责的部门 ID 列表
  const leadingDeptIds = user.leadingDepartments?.map((d) => d.id) ?? [];
  // 获取用户所属的部门 ID 列表
  const memberDeptIds = user.departments?.map((d) => d.id) ?? [];

  // 部门负责人：管理本部门及子部门
  if (leadingDeptIds.length > 0) {
    builder.can(Actions.Manage, "Department", { id: { in: leadingDeptIds } });
    builder.can(Actions.Manage, "Department", {
      parentId: { in: leadingDeptIds },
    });
  }

  // 部门成员：仅查看本部门
  if (memberDeptIds.length > 0) {
    builder.can(Actions.Read, "Department", { id: { in: memberDeptIds } });
  }
}
```

同时需扩展 `ReqUser` 类型，包含 `departments` 和 `leadingDepartments` 字段。

---

## 5. 非目标（不在范围内）

1. 不支持三级及以上部门结构
2. 不支持跨部门调动成员
3. 不支持部门合并/拆分功能
4. 不支持部门历史记录/审计日志
5. 不包含前端页面实现

---

## 6. 技术考量

### 6.1 Prisma 模型设计原则

- 使用隐式多对多关联（Prisma 自动创建中间表）
- 部门成员关系：`User[] @relation("DeptMembers")`
- 部门负责人关系：`User[] @relation("DeptLeaders")`
- 避免过度设计，不手动创建中间表

### 6.2 控制器开发规范

- 遵循 `nestjs-controller.mdc` 规范
- POST + Body 统一传参
- 使用 `ResultData` 标准响应
- 配置 `@Permission` 权限装饰器
- 在 `casl-ability.factory.ts` 中添加部门权限策略

### 6.3 目录结构

```
backend/src/modules/sys_dept/
├── dto/
│   ├── create-dept.dto.ts       # 创建部门 DTO
│   ├── update-dept.dto.ts       # 更新部门 DTO
│   ├── dept-query.dto.ts        # 部门查询 DTO（含分页）
│   ├── dept-id.dto.ts           # 部门 ID DTO
│   ├── add-member.dto.ts        # 添加成员 DTO（含 username/password/departmentId/isLeader）
│   ├── remove-member.dto.ts     # 移除成员 DTO
│   ├── set-leaders.dto.ts       # 设置负责人 DTO
│   └── members-query.dto.ts     # 成员列表查询 DTO
├── entities/
│   ├── dept.entity.ts           # 部门实体
│   └── dept-member.entity.ts    # 部门成员实体（用于响应）
├── sys_dept.controller.ts
├── sys_dept.module.ts
└── sys_dept.service.ts
```

---

## 7. 成功指标

1. 所有接口通过单元测试
2. 权限隔离正确：各层级用户只能访问授权范围内的数据
3. 部门树查询性能良好（< 100ms）
4. 代码通过 `pnpm build` 编译检查
5. API 文档（Swagger）完整准确

---

## 8. 待确认问题

1. ~~部门层级是否仅支持两级？~~ **已确认：是**
2. ~~用户是否可以属于多个部门？~~ **已确认：是**
3. ~~部门负责人是否可以有多个？~~ **已确认：是**
4. ~~成员创建后是否可以变更部门？~~ **已确认：不可变更**
