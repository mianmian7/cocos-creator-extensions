# Repository Guidelines

## Project Structure & Module Organization
- 根目录 `extensions/` 存放插件：`localization-editor`、`shader-graph`。
- 源码：`extensions/*/src`（TS/JS）；构建产物：`localization-editor/webpack-dist`、`shader-graph/dist`。
- 测试：`extensions/*/tests`，命名 `*.test.ts`。
- 资源：`extensions/*/static`、`shader-graph/shader-node/assets`、`localization-editor/resources`。
- 脚本编排：`workflow/scripts/*`（跨插件 build/test/pack/publish）；版本发布：`scripts/release.js`。

## Build, Test, and Development Commands
- 根目录
  - `npm run build`：依次构建所有插件；仅构建某个插件示例：`npm run build --extension=shader-graph`。
  - `npm test`：为每个插件执行 install/build/test（个别不稳定用例可能被跳过）。
  - `npm run pack`：将各插件打包为 zip 到 `dist/`。
  - `npm run publish`：安装、构建并打包（CI/发布使用）。
  - `npm run release[:patch|minor|major]`：更新版本、打 tag 并推送（仅维护者）。
- 插件内
  - localization-editor：`npm run dev`、`npm run build`、`npm test`（Jest）、`npm run pack`。
  - shader-graph：`npm run watch`、`npm run build`、`npm test`（Node test runner）、`npm run pack`。

## Coding Style & Naming Conventions
- 文件编码统一 UTF-8（无 BOM），行尾 LF。
- Prettier：4 空格缩进、单引号；ESLint：`plugin:prettier/recommended`。
- 文件/目录命名使用 kebab-case；源码优先使用 TypeScript（`.ts`）。
- 提交前本地格式化/校验：`npx prettier --write .`、`npx eslint . --ext .ts,.js`。

## Testing Guidelines
- 框架：Jest（localization-editor）、Node Test Runner（shader-graph）。
- 命名：`*.test.ts`；覆盖核心逻辑，新增功能需配套单测。
- 运行：根目录 `npm test` 或在插件目录内分别运行；仅测单个插件：`npm run test --extension=shader-graph`。

## Commit & Pull Request Guidelines
- 提交遵循 Conventional Commits：`feat`/`fix`/`docs`/`chore`/`refactor`/`test` 等。
  示例：`feat(shader-graph): support group nodes`。
- PR 请包含：变更说明、关联 Issue（如 `Closes #123`），UI 相关附截图/GIF；确保本地构建与测试通过。
- 避免提交构建产物；发布时由维护者在 release 流程中更新打包结果。
- 分支命名：`feature/<ext>-<topic>`、`fix/<ext>-<bug>`。

## Security & Configuration Tips
- 推荐 Node.js 16+；安装依赖若遇到 peer 冲突，可用 `npm install --legacy-peer-deps`。
- Cocos Creator 兼容版本见各插件 `package.json` 的 `editor` 字段（≥3.8.x）。

## Agent-Specific Instructions
- 修改尽量最小、聚焦需求，遵循本文件规范；仅变更相关插件目录。
- 若同路径存在更细粒度的 AGENTS.md，则以就近目录为准。

