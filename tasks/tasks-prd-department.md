# 任务列表: 部门管理模块

> 基于 `prd-department.md` 生成

## Relevant Files

- `backend/prisma/schema/dept.prisma` - 部门数据模型定义（新建）
- `backend/prisma/schema/user.prisma` - 用户模型扩展（添加部门关联字段）
- `backend/src/app.module.ts` - 应用模块（注册 SysDeptModule）
- `backend/src/modules/sys_dept/sys_dept.module.ts` - 部门模块定义（新建）
- `backend/src/modules/sys_dept/sys_dept.controller.ts` - 部门控制器（新建，包含所有接口实现）
- `backend/src/modules/sys_dept/sys_dept.service.ts` - 部门业务逻辑服务（新建）
- `backend/src/modules/sys_dept/dto/create-dept.dto.ts` - 创建部门 DTO（新建）
- `backend/src/modules/sys_dept/dto/update-dept.dto.ts` - 更新部门 DTO（新建）
- `backend/src/modules/sys_dept/dto/dept-query.dto.ts` - 部门查询 DTO（新建）
- `backend/src/modules/sys_dept/dto/dept-id.dto.ts` - 部门 ID DTO（新建）
- `backend/src/modules/sys_dept/dto/add-member.dto.ts` - 添加成员 DTO（新建）
- `backend/src/modules/sys_dept/dto/remove-member.dto.ts` - 移除成员 DTO（新建）
- `backend/src/modules/sys_dept/dto/set-leaders.dto.ts` - 设置负责人 DTO（新建）
- `backend/src/modules/sys_dept/dto/members-query.dto.ts` - 成员列表查询 DTO（新建）
- `backend/src/modules/sys_dept/entities/dept.entity.ts` - 部门实体（新建）
- `backend/src/modules/sys_dept/entities/dept-member.entity.ts` - 部门成员实体（新建）
- `backend/src/shared/casl/casl-ability.factory.ts` - CASL 权限策略（添加 handleDepartmentAbility）
- `backend/src/shared/casl/casl-interface.ts` - CASL 接口定义（添加 Department 到 CaslModels）
- `backend/src/modules/sys_auth/types/request.ts` - ReqUser 类型扩展（添加部门关联）
- `backend/src/modules/sys_auth/jwt.strategy.ts` - JWT 策略（加载部门信息）

### Notes

- 遵循 `nestjs-controller.mdc` 控制器开发规范
- 使用 Prisma 隐式多对多关联，避免过度设计中间表
- 完成开发后执行 `pnpm build` 进行编译检查
- 执行 `pnpm migrate:dev` 应用数据库迁移

## Tasks

- [x] 1.0 Prisma 数据模型设计与迁移

  - [x] 1.1 在 `dept.prisma` 中设计 Department 模型（含自关联、隐式多对多）
  - [x] 1.2 在 `user.prisma` 中扩展 User 模型（添加 departments、leadingDepartments、createdDepartments 关联）
  - [x] 1.3 执行 `pnpm prisma:generate` 生成 Prisma Client
  - [x] 1.4 执行 `make dg` 同步数据库

- [x] 2.0 部门模块基础结构搭建

  - [x] 2.1 创建 `sys_dept` 模块目录结构（dto/、entities/）
  - [x] 2.2 创建 `sys_dept.module.ts` 模块定义文件
  - [x] 2.3 创建 `sys_dept.service.ts` 服务文件（空实现）
  - [x] 2.4 创建 `sys_dept.controller.ts` 控制器文件（空实现）
  - [x] 2.5 创建所有 DTO 文件（create-dept、update-dept、dept-query、dept-id、add-member、remove-member、set-leaders、members-query）
  - [x] 2.6 创建 Entity 文件（dept.entity、dept-member.entity）
  - [x] 2.7 在 `app.module.ts` 中注册 SysDeptModule

- [x] 3.0 部门 CRUD 接口开发

  - [x] 3.1 实现 `POST /sys-dept/create` 创建部门接口（含层级限制校验）
  - [x] 3.2 实现 `POST /sys-dept/update` 更新部门信息接口
  - [x] 3.3 实现 `GET /sys-dept/:id` 获取部门详情接口
  - [x] 3.4 实现 `DELETE /sys-dept/:id` 删除部门接口（含子部门/成员检查）
  - [x] 3.5 实现 `POST /sys-dept/list` 分页查询部门列表接口
  - [x] 3.6 实现 `GET /sys-dept/tree` 获取部门树结构接口

- [x] 4.0 成员管理接口开发

  - [x] 4.1 实现 `POST /sys-dept/members` 查询部门成员列表接口
  - [x] 4.2 实现 `POST /sys-dept/add-member` 添加部门成员接口（含创建账号、密码加密、角色分配）
  - [x] 4.3 实现 `POST /sys-dept/remove-member` 移除部门成员接口
  - [x] 4.4 实现 `POST /sys-dept/set-leaders` 设置部门负责人接口

- [x] 5.0 CASL 数据权限策略实现

  - [x] 5.1 扩展 `ReqUser` 类型（添加 departments、leadingDepartments 字段）
  - [x] 5.2 扩展 `casl-interface.ts`（添加 Department 到 Subjects 类型）
  - [x] 5.3 实现 `handleDepartmentAbility` 函数（部门负责人/成员权限策略）
  - [x] 5.4 在 `defineAbilityFor` 中集成 Department 权限分支
  - [x] 5.5 更新 `jwt.strategy.ts` 加载部门信息

- [x] 6.0 编译检查与验证
  - [x] 6.1 执行 `pnpm build` 检查编译
  - [x] 6.2 修复编译错误（如有）
  - [x] 6.3 验证 Swagger 文档生成正确
