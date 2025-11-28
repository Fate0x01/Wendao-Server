# Repository Guidelines

## Project Structure & Module Organization

- Entry at `src/main.tsx`; routing defined in `src/router`, with layout shells in `src/layouts`.
- Route-level screens live in `src/pages`; reusable feature blocks in `src/modules`; shared UI in `src/components`.
- Data and API helpers sit in `src/services`; shared hooks and utilities in `src/hooks` and `src/utils`; styling tokens and theme assets in `src/styles` and `src/assets`.
- Mock APIs reside in `mock/` (via `vite-plugin-mock`); static assets served from `public/`; docs and screenshots in `docs/`.
- Build and tooling configs: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, and `tsconfig.json`.

## Build, Test, and Development Commands

- Install dependencies: `npm install` (or `pnpm install`; stay consistent with the lockfile you touch).
- Local dev with live reload: `npm run dev`; mock API mode: `npm run dev:mock`; Linux/headless dev without auto-open: `npm run dev:linux`.
- Production bundle: `npm run build` (release mode); test/staging bundle: `npm run build:test`; serve a built bundle: `npm run preview`; static site export: `npm run site:preview` (copies `dist` to `_site`).
- Linting: `npm run lint`; auto-fix: `npm run lint:fix`.

## Coding Style & Naming Conventions

- TypeScript + React function components and hooks; avoid class components.
- ESLint (Airbnb + react-app) plus Prettier handle formatting—run lint before PRs instead of hand-formatting.
- Naming: components in PascalCase (`UserTable.tsx`), hooks as `useThing.ts`, utilities camelCase, styles matching component names.
- Styling: prefer design tokens from TDesign/Tailwind utilities; keep custom colors centralized in `styles` or config files.

## Testing Guidelines

- Automated tests are not yet wired; `npm test` and `npm run test:coverage` are placeholders. When adding tests, colocate `*.test.ts(x)` in `__tests__` folders or beside the source, and ensure they run via `npm test`.
- Include critical path coverage for data fetching, routing guards, and reusable components; document any gaps in the PR.

## Commit & Pull Request Guidelines

- Follow Conventional/Angular commit style (`feat:`, `fix:`, `chore:`, optional scopes like `feat(auth): ...`); use focused commits.
- Branch naming per README: `feat/<topic>` (or similar short topic).
- Before opening a PR: run lint/build, clean mock data, and verify the preview if UI changes.
- PR description should link related issues, list manual test steps, and include before/after screenshots for UI updates; call out new env vars or breaking changes.

## 其他规则

- 代码中，解释与注释需要采用中文
- 回答中，解释与说明需要采用中文
- 完成所有开发后，需要执行 pnpm build 等系列命令对应用进行检查，当存在因本次变动导致的异常，需要进行修复

## 规则文件调用

## MCP Rules (MCP 调用规则)

**目标** 为 Codex 提供多项 MCP 服务（Sequential Thinking、Context7）的选择与调用规范，控制查询粒度、速率与输出格式，保证可追溯与安全。

- **工具选择**：根据任务意图选择最匹配的 MCP 服务；避免无意义并发调用。
- **单轮单工具**：每轮对话最多调用 1 种外部服务；确需多种时串行并说明理由。
- **最小必要**：收敛查询范围（tokens/结果数/时间窗/关键词），避免过度抓取与噪声。
- **可追溯性**：统一在答复末尾追加“**工具调用简报**”（工具、输入摘要、参数、时间、来源/重试）。
- **降级优先**：服务失败时，按“失败与降级”执行，无法外呼时提供本地保守答案并标注不确定性。

#### 服务清单与用途

- **Sequential Thinking**：规划与分解复杂任务，形成可执行计划与里程碑。
- **Context7**：检索并引用官方文档/API，用于库/框架/版本差异与配置问题。

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
> - **结果概览**: <条数/库 ID 或主要来源域名/是否命中>
> - **时间**:
