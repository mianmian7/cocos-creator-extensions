# WARP.md

此文件为 WARP (warp.dev) 在此代码库中工作时提供指导。

## 项目概述

这是一个 Cocos Creator 公开扩展插件库，用于存储可在 Cocos Creator 编辑器中使用的扩展插件。项目采用单体架构（monorepo），在 `extensions/` 目录下管理多个插件。

### 主要插件
- **shader-graph**: 着色器图形编辑器插件（需要 Cocos Creator >= 3.8.2）
- **localization-editor**: 本地化编辑器插件（需要 Cocos Creator >= 3.7.0）

## 命令参考

### 核心开发命令
```bash
# 初始化所有插件
npm install

# 构建所有插件
npm run build

# 打包所有插件为 zip 文件（输出到 dist/ 目录）
npm run pack

# 运行所有插件的单元测试
npm run test

# CI 构建（等同于测试）
npm run ci
```

### 单个插件操作
使用 `--extension="插件名"` 或 `--ext="插件名"` 参数来操作单个插件：

```bash
# 仅构建 shader-graph 插件
npm run build --ext="shader-graph"

# 仅测试 localization-editor 插件
npm run test --extension="localization-editor"

# 仅打包特定插件
npm run pack --ext="shader-graph"
```

### 插件特定命令

#### localization-editor
```bash
cd extensions/localization-editor

# 开发构建（带源码映射）
npm run build:dev

# 生产构建
npm run build:prod

# 监视模式构建
npm run dev

# 生成 ICU 选项
npm run generate-icu-option

# 生成主进程 IPC 代码
npm run generate-main-ipc
```

#### shader-graph
```bash
cd extensions/shader-graph

# 监视模式构建
npm run watch

# 构建 Less 样式文件
npm run build-less

# 运行 Node.js 测试
npm run test
```

## 代码架构

### 目录结构
```
cocos-creator-extensions/
├── workflow/                 # 构建脚本和工具
│   └── scripts/             # 通用构建脚本（build.js, pack.js 等）
├── extensions/              # 插件目录
│   ├── localization-editor/ # 本地化插件
│   └── shader-graph/        # 着色器图形插件
└── dist/                    # 打包输出目录
```

### 工作流系统
- 所有构建操作通过 `workflow/scripts/common.js` 统一管理
- 支持跨平台命令执行（Windows/Unix）
- 自动发现并处理 `extensions/` 目录下的所有插件
- 每个插件必须有自己的 `package.json` 才会被处理

### 插件架构（Cocos Creator 扩展）

#### 通用插件结构
- `package.json`: 插件清单，定义面板、贡献点、消息等
- `main.js` 或 `dist/main.js`: 插件主入口
- `static/`: 静态资源（图标等）
- `i18n/`: 国际化文件

#### localization-editor 特性
- **技术栈**: TypeScript + Vue 3 + Webpack + Jest
- **架构**: 基于 Electron 的主进程/渲染进程架构
- **构建系统**: Webpack 配置，支持 SWC 编译器
- **测试**: Jest 单元测试
- **依赖注入**: 使用 tsyringe
- **文件处理**: 支持多种格式（PO、XLSX、YAML）

#### shader-graph 特性
- **技术栈**: TypeScript + Vue 2 + Less
- **UI 系统**: 基于 @itharbors/ui-graph 的图形节点编辑器
- **构建系统**: TypeScript 编译 + Less 预处理
- **测试**: Node.js 内置测试运行器
- **资产处理**: 自定义 `.shadergraph` 文件导入器

### 开发模式
1. **开发阶段**: 在对应插件目录下进行开发和测试
2. **构建阶段**: 使用 `npm run build` 编译所有插件
3. **打包阶段**: 使用 `npm run pack` 生成可安装的 zip 文件
4. **安装阶段**: 在 Cocos Creator 编辑器中导入 zip 文件

## 编码规范

### 代码格式化
- **ESLint**: 基于 Prettier 配置
- **Prettier**: 4 空格缩进，单引号
- 所有文件必须使用 UTF-8 编码（无 BOM），禁止使用 GBK/ANSI

### 语言使用
- 默认使用简体中文进行 issues、PRs 和助手回复
- 代码标识符、CLI 命令、日志和错误消息保持原始语言
- 需要时添加简洁的中文解释

### TypeScript 配置
- 使用严格的 TypeScript 配置
- 支持装饰器和实验性功能
- 使用路径映射简化导入

## 故障排除

### 常见问题
1. **构建失败**: 确保所有插件的依赖都已正确安装（检查各插件的 `package.json`）
2. **打包失败**: 确保插件已成功构建，且输出目录存在
3. **单个插件操作**: 使用正确的插件名称（与目录名一致）

### 调试
- 使用 `--log` 环境变量查看详细的错误信息
- 检查各插件的构建配置和依赖关系
- 确保 Cocos Creator 编辑器版本兼容性
