# Repository Guidelines

Contributor quick-start tailored to this NestJS + Prisma backend.

## Project Structure & Module Organization

- `src/` holds all code; domain modules live in `src/modules/*` with paired `*.module.ts`, `*.controller.ts`, and `*.service.ts`.
- Cross-cutting pieces sit in `src/common` (filters, interceptors, decorators) and `src/shared` (Prisma extension, CASL utilities).
- Database schema and seeds are in `prisma/schema/*.prisma` and `prisma/seed.ts`; compiled output goes to `dist/`.
- Tooling configs: `nest-cli.json`, `tsconfig*.json`, `webpack.config.js`, and `Makefile`.

## Build, Test, and Development Commands

- Install deps: `pnpm install`.
- Dev server with watch: `pnpm start:dev`; debug: `pnpm start:debug`.
- Build bundle to `dist/`: `pnpm build`; run production build: `pnpm start:prod`.
- Lint/format: `pnpm lint` (ESLint + fixes) and `pnpm format` (Prettier).
- Tests: `pnpm test` (unit), `pnpm test:watch`, `pnpm test:cov`, `pnpm test:e2e` (expects `test/jest-e2e.json` and tests under `test/`).
- Database: `pnpm migrate:dev` (create + apply), `pnpm migrate:deploy` (apply only), `pnpm prisma:generate`, `pnpm seed` / `pnpm prisma:seed`.

## Coding Style & Naming Conventions

- TypeScript, 2-space indent, single quotes, no semicolons (Prettier defaults). Keep imports ordered logically (framework → libs → local).
- Follow Nest patterns: modules/services/controllers suffixed accordingly; guards/interceptors/filters stay in `src/common`.
- Prefer dependency injection over newing instances; place DTOs and validators alongside their module.

## Testing Guidelines

- Jest is configured with root `src` and `testRegex: .*\\.spec\\.ts$`; place unit specs next to the code they cover.
- Use `describe('<Module>')` and intention-revealing `it('should ...')`; mock external services/Redis/Prisma.
- Aim for meaningful coverage via `pnpm test:cov`; e2e specs belong under `test/` with their own config file.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`); current history uses `feat: init project`.
- PRs should state intent, list commands run (tests, migrations, seeds), call out env or schema changes, and link issues/trackers. Include screenshots or API docs URLs if behavior changes.

## Security & Configuration Tips

- Environment is loaded via `@nestjs/config`; common keys seen in `main.ts`: `PORT`, `API_PREFIX`, `SWAGGER_ENABLE`, `SWAGGER_*`, `CORS_ENABLE`, `CORS_ORIGIN`, `NULL_INTERCEPTOR_ENABLE`, `TRIM_STRING_INTERCEPTOR_ENABLE`.
- Keep secrets out of git; use `.env.local`/deployment secrets. Run `pnpm migrate:dev` and `pnpm prisma:generate` when schema changes before starting the app.

## 其他规则

- 代码中，解释与注释需要采用中文
- 回答中，解释与说明需要采用中文
- 完成所有开发后，需要执行 pnpm build 等系列命令对应用进行检查，当存在因本次变动导致的异常，需要进行修复

## 规则文件调用

### 控制器

开发控制器时，需要遵循 `../.cursor/rules/backend/nestjs-controller.mdc` 规范要求

## MCP Rules (MCP 调用规则)

**目标** 为 Codex 提供多项 MCP 服务（Sequential Thinking、Context7）的选择与调用规范，控制查询粒度、速率与输出格式，保证可追溯与安全。

- **工具选择**：根据任务意图选择最匹配的 MCP 服务；避免无意义并发调用。
- **单轮单工具**：每轮对话最多调用 1 种外部服务；确需多种时串行并说明理由。
- **最小必要**：收敛查询范围（tokens/结果数/时间窗/关键词），避免过度抓取与噪声。
- **可追溯性**：统一在答复末尾追加“**工具调用简报**”（工具、输入摘要、参数、时间、来源/重试）。
- **降级优先**：服务失败时，按“失败与降级”执行，无法外呼时提供本地保守答案并标注不确定性。

#### 服务清单与用途

- [ ] **Sequential Thinking**：规划与分解复杂任务，形成可执行计划与里程碑。
- [ ] **Context7**：检索并引用官方文档/API，用于库/框架/版本差异与配置问题。

#### 服务选择与调用（意图判定）

- **规划/分解** → Sequential Thinking
- **文档/API** → Context7

#### 具体服务规则

**Sequential Thinking（规划分解）**

- **触发**：分解复杂问题、规划步骤、生成执行计划、评估方案。
- **输出**：仅产出可执行计划与里程碑，不暴露中间推理细节。
- **约束**：步骤上限 6-10；每步一句话。

**Context7（技术文档知识聚合）**

- **触发**：查询 SDK/API/框架官方文档、快速知识提要、参数示例。
- **流程**：先 `resolve-library-id`；确认最相关库；再 `get-library-docs`。
- **输出**：精炼答案 + 引用文档段落链接或出处标识；标注库 ID/版本。

#### 工具调用简报（模板）

若使用 MCP，在答复末尾追加：

> **工具调用简报**
>
> - **工具**:
> - **触发原因**: <为何需要该工具>
> - **输入摘要**: <关键词/库/topic/查询意图>
> - **结果概览**: <条数/库ID或主要来源域名/是否命中>
> - **时间**:
