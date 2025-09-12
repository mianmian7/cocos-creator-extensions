# 更新日志

所有项目的重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 添加了自动 CI/CD 流程
- 添加了自动发布 GitHub Release 功能

### 修复
- 修复了 Node.js v22 在 CI 环境中的兼容性问题
- 修复了扩展跳过逻辑中的 bug
- 修复了 chalk 依赖缺失问题

### 变更
- 更新 GitHub Actions 到最新版本
- 优化构建和测试流程

## [1.0.0] - 2024-XX-XX

### 新增
- localization-editor 扩展
- shader-graph 扩展
- 基础项目结构和工作流脚本

### 扩展功能

#### localization-editor
- 国际化编辑器功能
- 支持多语言翻译
- 自动扫描和提取文本
- 支持导入/导出翻译文件

#### shader-graph
- 可视化着色器编辑器
- 节点式着色器创建
- 支持 Cocos Creator 3.8+
- 内置丰富的着色器节点库

[未发布]: https://github.com/your-username/cocos-creator-extensions/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/cocos-creator-extensions/releases/tag/v1.0.0
