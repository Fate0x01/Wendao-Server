# 任务列表：云仓库存管理与采购订单管理模块

## Relevant Files

### 后端文件

- `backend/src/modules/sys_stock/dto/yun-cang-stock-query.dto.ts` - 云仓库存查询 DTO，包含筛选条件（部门 ID、SKU 关键词、负责人、店铺名称、是否达到补货预警、是否滞销产品等）
- `backend/src/modules/sys_stock/dto/set-yun-cang-reorder-threshold.dto.ts` - 设置云仓库存补货预警阈值 DTO
- `backend/src/modules/sys_stock/dto/inventory-pool-info-query.dto.ts` - 库存池信息查询 DTO
- `backend/src/modules/sys_stock/dto/configure-inventory-pool.dto.ts` - 库存池配置 DTO（支持 merge 和 split 操作）
- `backend/src/modules/sys_stock/dto/purchase-order-create.dto.ts` - 采购订单创建 DTO
- `backend/src/modules/sys_stock/dto/purchase-order-query.dto.ts` - 采购订单查询 DTO
- `backend/src/modules/sys_stock/dto/purchase-order-update.dto.ts` - 采购订单更新 DTO
- `backend/src/modules/sys_stock/entities/yun-cang-stock-group.entity.ts` - 云仓库存分组实体（按商品分组，显示库存池数量）
- `backend/src/modules/sys_stock/entities/yun-cang-stock-statistics.entity.ts` - 云仓库存统计实体
- `backend/src/modules/sys_stock/entities/inventory-pool-info.entity.ts` - 库存池信息实体
- `backend/src/modules/sys_stock/entities/purchase-order.entity.ts` - 采购订单实体
- `backend/src/modules/sys_stock/entities/purchase-detail.entity.ts` - 采购详情实体
- `backend/src/modules/sys_stock/sys_stock.service.ts` - 库存服务，包含云仓库存查询、统计、库存池管理、采购订单管理等业务逻辑
- `backend/src/modules/sys_stock/sys_stock.controller.ts` - 库存控制器，包含所有云仓库存和采购订单相关的 API 接口
- `backend/src/shared/casl/casl-ability.factory.ts` - CASL 权限工厂，需要添加`handleYunCangStockAbility`函数处理云仓库存权限
- `backend/src/shared/casl/casl-interface.ts` - CASL 接口定义，需要添加`YunCangStockInfo`和`PurchaseOrder`模型

### 前端文件

- `frontend/src/pages/Business/StockManager/YunCang/index.tsx` - 云仓库存管理页面，包含查询、统计、设置补货预警阈值等功能
- `frontend/src/pages/Business/StockManager/YunCang/InventoryPool/index.tsx` - 库存池管理页面，包含库存池信息查询和配置功能
- `frontend/src/pages/Business/PurchaseOrder/index.tsx` - 采购订单管理页面，包含创建、查询、编辑、确认等功能
- `frontend/src/services/generated/index.ts` - 自动生成的 API 服务（通过 OpenAPI 生成）

### Notes

- 单元测试应该与代码文件放在同一目录下（例如：`sys_stock.service.spec.ts` 和 `sys_stock.service.ts` 在同一目录）
- 使用 `npx jest [optional/path/to/test/file]` 运行测试。不指定路径时执行所有测试
- 权限控制参考京仓库存的实现方式（`handleJingCangStockAbility`），需要为云仓库存添加类似的权限处理函数
- 采购订单的权限控制参考商品管理的权限控制逻辑（`handleGoodsAbility`）
- 部门确认操作需要使用数据库事务，确保库存增加和确认状态更新的原子性
- 库存池配置操作需要使用数据库事务，确保库存池创建、关联关系更新、数量分配的原子性

## Tasks

- [ ] 1.0 云仓库存查询与统计功能
  - [x] 1.1 在 `casl-interface.ts` 中添加 `YunCangStockInfo` 模型定义
  - [x] 1.2 在 `casl-ability.factory.ts` 中实现 `handleYunCangStockAbility` 函数，参考 `handleJingCangStockAbility` 的实现逻辑
  - [x] 1.3 创建 `yun-cang-stock-query.dto.ts` DTO，包含分页参数和筛选条件（部门 ID、SKU 关键词、负责人、店铺名称、是否达到补货预警、是否滞销产品、排序字段和排序方向）
  - [x] 1.4 创建 `yun-cang-stock-group.entity.ts` 实体，包含商品基本信息、云仓库存信息（日销量、月销量、补货预警阈值、滞销天数）和库存池实际数量
  - [x] 1.5 创建 `yun-cang-stock-statistics.entity.ts` 实体，包含总库存数量、总日销量、总月销量等统计信息
  - [x] 1.6 在 `sys_stock.service.ts` 中实现 `listYunCangStock` 方法，支持分页查询、筛选条件、权限控制，查询结果按创建时间倒序排列，显示库存池的实际数量
  - [x] 1.7 在 `sys_stock.service.ts` 中实现 `statisticsYunCangStock` 方法，支持与查询接口相同的筛选条件，返回统计汇总信息
  - [x] 1.8 在 `sys_stock.controller.ts` 中添加 `listYunCangStock` 接口（POST `/sys-stock/list-yun-cang-stock`），包含权限装饰器
  - [x] 1.9 在 `sys_stock.controller.ts` 中添加 `statisticsYunCangStock` 接口（POST `/sys-stock/statistics-yun-cang-stock`），包含权限装饰器
  - [x] 1.10 创建 `set-yun-cang-reorder-threshold.dto.ts` DTO，包含商品 ID 和补货预警阈值
  - [x] 1.11 在 `sys_stock.service.ts` 中实现 `setYunCangReorderThreshold` 方法，校验商品是否存在云仓库存信息，设置补货预警阈值
  - [x] 1.12 在 `sys_stock.controller.ts` 中添加 `setYunCangReorderThreshold` 接口（POST `/sys-stock/set-yun-cang-reorder-threshold`），包含权限装饰器
  - [x] 1.13 在前端创建 `frontend/src/pages/Business/StockManager/YunCang/index.tsx` 页面，实现云仓库存查询、统计展示、设置补货预警阈值等功能，参考京仓库存页面的实现
- [ ] 2.0 库存池管理功能（查询与配置）
  - [x] 2.1 创建 `inventory-pool-info-query.dto.ts` DTO，包含商品 ID 参数
  - [x] 2.2 创建 `inventory-pool-info.entity.ts` 实体，包含商品基本信息、当前关联的库存池 ID、库存池的实际数量、共用该库存池的其他商品列表、是否独立库存标识
  - [x] 2.3 创建 `configure-inventory-pool.dto.ts` DTO，包含操作类型（merge/split）、商品 ID 列表、目标库存池 ID（可选）、拆分数量（可选）
  - [x] 2.4 在 `sys_stock.service.ts` 中实现 `getYunCangInventoryPoolInfo` 方法，根据商品 ID 查询库存池信息，包括共用商品列表
  - [x] 2.5 在 `sys_stock.service.ts` 中实现 `configureInventoryPool` 方法，支持设置共用库存池和设置独立库存两种操作，使用数据库事务确保操作的原子性
  - [x] 2.6 在 `configureInventoryPool` 方法中实现合并库存池逻辑：如果目标商品都没有库存池，创建新的库存池；如果部分已有库存池，合并到指定库存池；如果都有不同库存池，累加数量后合并
  - [x] 2.7 在 `configureInventoryPool` 方法中实现拆分独立库存逻辑：从原库存池中分配数量（默认分配全部），如果原库存池还有其他商品，从原库存池中减去分配的数量
  - [x] 2.8 在 `sys_stock.controller.ts` 中添加 `getYunCangInventoryPoolInfo` 接口（POST `/sys-stock/get-yun-cang-inventory-pool-info`），包含权限装饰器
  - [x] 2.9 在 `sys_stock.controller.ts` 中添加 `configureInventoryPool` 接口（POST `/sys-stock/configure-inventory-pool`），包含权限装饰器，校验用户对所有涉及商品的管理权限
  - [x] 2.10 在前端创建 `frontend/src/pages/Business/StockManager/YunCang/InventoryPool/index.tsx` 页面，实现库存池信息查询和配置功能（设置共用库存池、设置独立库存）
- [ ] 3.0 采购订单 CRUD 功能
  - [x] 3.1 在 `casl-interface.ts` 中添加 `PurchaseOrder` 和 `PurchaseDetail` 模型定义
  - [x] 3.2 创建 `purchase-order-create.dto.ts` DTO，包含采购批次号（必填、唯一）和采购详情列表（至少一个），每个详情包含商品 ID、采购数量、采购金额、采购订单号（可选）、快递单号（可选）
  - [x] 3.3 创建 `purchase-order-query.dto.ts` DTO，包含分页参数和筛选条件（采购批次号、部门 ID、部门确认状态、财务确认状态、创建时间范围）
  - [x] 3.4 创建 `purchase-order-update.dto.ts` DTO，支持修改采购批次号和采购详情（如果已部门确认，禁止修改采购详情）
  - [x] 3.5 创建 `purchase-order.entity.ts` 实体，包含采购订单所有字段和关联的采购详情列表
  - [x] 3.6 创建 `purchase-detail.entity.ts` 实体，包含采购详情所有字段和关联的商品信息
  - [x] 3.7 在 `sys_stock.service.ts` 中实现 `createPurchaseOrder` 方法，校验采购批次号唯一性、商品存在性、用户权限，创建采购订单和采购详情
  - [x] 3.8 在 `sys_stock.service.ts` 中实现 `listPurchaseOrder` 方法，支持分页查询、筛选条件、权限控制（用户只能查询有权限管理的商品相关的采购订单），查询结果按创建时间倒序排列，包含关联的采购详情和商品信息
  - [x] 3.9 在 `sys_stock.service.ts` 中实现 `updatePurchaseOrder` 方法，支持修改采购批次号（校验新批次号唯一性）和采购详情（如果已部门确认，禁止修改采购详情），校验商品存在性和用户权限
  - [x] 3.10 在 `sys_stock.controller.ts` 中添加 `createPurchaseOrder` 接口（POST `/sys-stock/create-purchase-order`），包含权限装饰器
  - [x] 3.11 在 `sys_stock.controller.ts` 中添加 `listPurchaseOrder` 接口（POST `/sys-stock/list-purchase-order`），包含权限装饰器
  - [x] 3.12 在 `sys_stock.controller.ts` 中添加 `updatePurchaseOrder` 接口（POST `/sys-stock/update-purchase-order`），包含权限装饰器
  - [x] 3.13 在前端创建 `frontend/src/pages/Business/PurchaseOrder/index.tsx` 页面，实现采购订单的创建、查询、编辑功能，包含采购详情的增删改操作
- [ ] 4.0 采购订单确认流程（部门确认与财务确认）
  - [x] 4.1 在 `sys_stock.service.ts` 中实现 `confirmPurchaseOrderByDepartment` 方法，将部门确认状态设置为 true，使用数据库事务确保操作的原子性
  - [x] 4.2 在 `confirmPurchaseOrderByDepartment` 方法中实现库存增加逻辑：遍历采购详情，为每个商品增加云仓库存（如果商品没有云仓库存信息则创建，如果商品没有关联库存池则创建独立库存池，将采购数量累加到库存池）
  - [x] 4.3 在 `confirmPurchaseOrderByDepartment` 方法中实现变动日志记录：为每个采购详情中的商品记录变动日志，内容格式为"采购订单[批次号]确认，增加库存[数量]"，包含操作人信息
  - [x] 4.4 在 `confirmPurchaseOrderByDepartment` 方法中添加错误处理：如果库存增加失败，回滚部门确认状态并返回错误信息
  - [x] 4.5 在 `sys_stock.service.ts` 中实现 `confirmPurchaseOrderByFinance` 方法，将财务确认状态设置为 true，校验采购订单已部门确认
  - [x] 4.6 在 `sys_stock.controller.ts` 中添加 `confirmPurchaseOrderByDepartment` 接口（POST `/sys-stock/confirm-purchase-order-by-department`），包含权限装饰器
  - [x] 4.7 在 `sys_stock.controller.ts` 中添加 `confirmPurchaseOrderByFinance` 接口（POST `/sys-stock/confirm-purchase-order-by-finance`），包含权限装饰器
  - [x] 4.8 在前端 `frontend/src/pages/Business/PurchaseOrder/index.tsx` 页面中添加部门确认和财务确认按钮，实现确认功能
- [ ] 5.0 导出功能（云仓库存导出与采购订单导出）
  - [x] 5.1 在 `sys_stock.service.ts` 中实现 `exportYunCangStock` 方法，支持与查询接口相同的筛选条件，导出 Excel 文件，包含商品基本信息和云仓库存信息
  - [x] 5.2 在 `sys_stock.service.ts` 中实现 `exportPurchaseOrder` 方法，支持与查询接口相同的筛选条件，导出 Excel 文件，数据扁平化采购详情（每个采购详情作为一行）
  - [x] 5.3 在 `sys_stock.controller.ts` 中添加 `exportYunCangStock` 接口（POST `/sys-stock/export-yun-cang-stock`），包含权限装饰器
  - [x] 5.4 在 `sys_stock.controller.ts` 中添加 `exportPurchaseOrder` 接口（POST `/sys-stock/export-purchase-order`），包含权限装饰器
  - [x] 5.5 在前端 `frontend/src/pages/Business/StockManager/YunCang/index.tsx` 页面中添加导出按钮，实现云仓库存导出功能
  - [x] 5.6 在前端 `frontend/src/pages/Business/PurchaseOrder/index.tsx` 页面中添加导出按钮，实现采购订单导出功能
