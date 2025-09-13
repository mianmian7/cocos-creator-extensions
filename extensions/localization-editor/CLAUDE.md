[根目录](../../CLAUDE.md) > [extensions](../) > **localization-editor**

# Localization Editor 扩展模块

## 变更记录 (Changelog)

### 2025-09-14 - 模块文档初始化
- 分析 localization-editor 扩展架构
- 记录服务层和依赖注入架构
- 建立本地化工作流文档

---

## 模块职责

Localization Editor 是一个功能完整的本地化管理扩展，为 Cocos Creator 项目提供多语言支持和翻译管理工具。

### 核心功能
- **多语言管理**：添加、删除、配置目标语言
- **文本扫描**：自动扫描项目中的可本地化文本
- **翻译界面**：直观的翻译编辑和管理界面
- **自动翻译**：集成第三方翻译服务API
- **文件导入导出**：支持 PO、CSV、XLSX 等格式
- **实时预览**：在编辑器中预览不同语言版本

## 入口与启动

### 主入口文件
- **主进程**：`src/lib/main/main.ts` - 扩展主进程逻辑
- **面板入口**：`src/panel/default/index.ts` - 主编辑面板
- **构建器入口**：`src/lib/builder/builder.ts` - 构建时处理
- **场景脚本**：`src/lib/scene/scene.ts` - 场景编辑器集成

### 启动流程
1. 依赖注入容器初始化 (`tsyringe`)
2. 读取项目配置和语言设置
3. 初始化目录结构和资源挂载
4. 启动主线程服务和面板UI

### 依赖注入架构
```typescript
// 容器注册
import 'reflect-metadata';
import '../core/container-registry';
import { container } from 'tsyringe';

// 服务解析
const mainThread = container.resolve(MainThread);
```

## 对外接口

### 核心消息接口
```typescript
// 面板管理
"open-panel": 打开本地化编辑器面板
"close-panel": 关闭面板
"execute-panel-method": 执行面板方法

// 数据操作
"scan": 扫描项目中的本地化文本
"get-translate-data": 获取翻译数据
"save-translate-data": 保存翻译数据
"clear-translate-data": 清空翻译数据

// 语言管理
"add-target-language": 添加目标语言
"remove-target-language": 移除目标语言
"set-local-language-locale": 设置本地语言

// 翻译服务
"auto-translate": 自动翻译
"get-translate-providers": 获取翻译提供商
"set-current-translate-provider": 设置当前翻译提供商

// 文件操作
"import-translate-file": 导入翻译文件
"export-translate-file": 导出翻译文件
"import-media-files": 导入媒体文件
```

### REST API 服务
- **服务器端口**：动态分配
- **API 端点**：用于外部工具集成
- **数据格式**：JSON / 文件上传下载

## 关键依赖与配置

### 主要依赖
```json
{
  "vue": "^3.2.25",
  "webpack": "^5.74.0",
  "tsyringe": "^4.6.0",
  "i18next": "^21.6.16",
  "gettext-extractor": "^3.5.4",
  "gettext-parser": "^5.1.2",
  "axios": "^0.27.2",
  "xlsx": "^0.18.5"
}
```

### 构建配置
- **Webpack**：模块打包和多目标构建
- **SWC**：快速 TypeScript 编译
- **Vue 3**：现代化的用户界面框架
- **Less**：CSS 预处理器

### 编辑器配置
- **最低版本**：Cocos Creator 3.8.5+
- **面板尺寸**：最小 1000x750，默认 1280x1200
- **资产挂载**：静态资源只读挂载

## 数据模型

### 翻译数据结构
```typescript
interface TranslateData {
  key: string;           // 翻译键
  source: string;        // 源文本
  translations: {        // 翻译映射
    [locale: string]: string;
  };
  context?: string;      // 上下文信息
  file?: string;         // 源文件路径
}
```

### 语言配置
```typescript
interface LanguageConfig {
  locale: string;        // 语言标识
  name: string;          // 语言名称
  enabled: boolean;      // 是否启用
  isDefault: boolean;    // 是否默认语言
}
```

### 项目配置
```typescript
interface ProjectConfig {
  scanOptions: ScanOptions;          // 扫描配置
  languages: LanguageConfig[];       // 语言列表
  translateProvider: string;         // 翻译服务提供商
  outputFormat: 'po' | 'json' | 'csv';  // 输出格式
}
```

## 服务架构

### 核心服务层
```
src/lib/core/service/
├── persistent/          // 持久化服务
│   ├── ProjectConfigService.ts
│   ├── EditorConfigService.ts
│   └── TranslateDataSourceService.ts
├── scanner/            // 扫描服务
│   ├── ScanService.ts
│   └── FileScanService.ts
├── translate/          // 翻译服务
│   └── TranslateService.ts
├── component/          // 组件服务
│   └── l10n-component-manager-service.ts
└── util/               // 工具服务
    ├── EventBusService.ts
    ├── UUIDService.ts
    └── global.ts
```

### 仓库层 (Repository Pattern)
```
src/lib/core/repository/
└── translate/
    ├── YouDaoRepository.ts    // 有道翻译API
    ├── GoogleRepository.ts    // Google 翻译API
    └── BaiduRepository.ts     // 百度翻译API
```

### 数据访问层
- **Reader**: PO/CSV/XLSX 文件读取
- **Writer**: 多格式文件写入
- **Parser**: gettext 格式解析

## 测试与质量

### 测试结构
```
tests/
├── service/                    // 服务层测试
├── repository/                 // 仓库层测试
├── translate-file/            // 文件操作测试
├── yaml/                      // YAML 处理测试
└── gettext-extractor.test.ts  // 文本提取测试
```

### 测试工具
- **Jest**：主要测试框架
- **@swc/jest**：快速编译
- **ts-jest**：TypeScript 支持

### 测试策略
- **单元测试**：服务层和工具函数
- **集成测试**：文件处理和API调用
- **UI测试**：Vue 组件测试

## 常见问题 (FAQ)

### Q: 如何添加新的翻译服务提供商？
A: 在 `repository/translate/` 目录下创建新的仓库类，实现 `ITranslateRepository` 接口，然后在工厂类中注册。

### Q: 支持哪些文件格式？
A: 支持 PO (gettext)、CSV、XLSX 格式的导入导出，以及 JSON 格式的运行时数据。

### Q: 如何自定义文本扫描规则？
A: 修改扫描配置，可以设置包含/排除的文件模式，以及自定义的文本提取规则。

### Q: 翻译数据存储在哪里？
A: 翻译数据存储在项目的 `i18n/` 目录下，支持多种格式的持久化存储。

### Q: 如何在运行时切换语言？
A: 使用 `l10n` 组件的 API，调用语言切换方法，系统会自动重新渲染相关UI。

## 相关文件清单

### 核心源码
- `src/lib/main/` - 主进程逻辑
- `src/lib/core/` - 核心服务和架构
- `src/panel/` - 用户界面面板
- `src/lib/builder/` - 构建集成
- `src/lib/scene/` - 场景编辑器集成

### 配置文件
- `webpack.config.ts` - Webpack 构建配置
- `jest.config.ts` - 测试配置
- `tsconfig.json` - TypeScript 配置
- `package.json` - 扩展配置和依赖

### 资源文件
- `static/` - 静态资源和图标
- `resources/` - 语言数据和配置文件
- `i18n/` - 国际化字符串

### 开发工具
- `bin/` - 开发和构建脚本
- `runtime-node-modules/` - 运行时 Node.js 模块

---

*模块版本：1.0.4 | 最后更新：2025-09-14*