# Repository Guidelines

本文件仅适用于 `extensions/shader-graph/` 目录；与仓库根级 AGENTS.md 冲突时，以此文件为准。

## Project Structure & Module Organization
- `src/`：TypeScript 源码（panels、contributions、importer 等）。
- `shader-node/assets/`：内置只读资源，通过 asset-db 挂载。
- `static/`：面板静态资源，`style.less` 编译为 `style.css`。
- `i18n/`：多语言文案。
- `tests/`：单测（Node Test Runner），命名 `*.test.ts`。
- `dist/`：构建产物（`main.js`、`panels/*`、`hooks.js` 等）。
- `lib/`：构建/打包脚本（如 `pack.ts`）。
- `example/`：示例与用法。

## Build, Test, and Development Commands
- 在本目录运行：
  - `npm run watch`：TypeScript 增量编译，便于本地开发。
  - `npm run build`：编译 Less + TypeScript，输出到 `dist/`。
  - `npm test`：使用 Node Test Runner 运行 `tests/`。
  - `npm run pack`：执行 `lib/pack.ts` 打包扩展 zip（用于发布/CI）。
- 从仓库根仅构建此插件：`npm run build --extension=shader-graph`。

## Coding Style & Naming Conventions
- 文件编码 UTF-8（无 BOM），行尾 LF；优先使用 TypeScript。
- Prettier：4 空格缩进、单引号；ESLint：`plugin:prettier/recommended`。
- 目录/文件使用 kebab-case；面板、消息、脚本标识遵循现有命名。
- 提交前执行格式化/校验（仓库根或本目录）：
  `npx prettier --write . && npx eslint . --ext .ts,.js`。

## Testing Guidelines
- 测试文件命名 `*.test.ts`，覆盖核心节点解析、导入器与关键交互。
- 新功能必须配套单测与边界用例；本地运行 `npm test` 验证。

## Commit & Pull Request Guidelines
- 遵循 Conventional Commits；scope 建议 `shader-graph`。
  示例：`feat(shader-graph): support group nodes`。
- PR 需包含变更说明、关联 Issue（如 `Closes #123`），UI 改动附截图/GIF；
  确保构建与测试通过；避免提交 `dist/` 构建产物。

## 常见问题（FAQ）
- 依赖安装冲突：`npm install --legacy-peer-deps`。
- Node 版本：建议 16+；低版本可能导致 `node --test` 失败。
- Cocos Creator 兼容性：见 `package.json` 的 `editor` 字段（≥3.8.2）。
- 样式未生效：执行 `npm run build` 以生成 `static/.../style.css`。
- 资源看不见：检查 asset-db 挂载与 `profile.project.enableShaderNode` 配置。

