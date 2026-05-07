# 站点适配器

[English](adapters.en.md)

适配器用于隔离站点特有 DOM 差异，避免通用内容脚本逻辑被站点细节污染。

## 接口

- `match()`：判断当前页面是否启用适配器
- `getInputBoxes()`：提供额外输入框目标
- `injectRewriteButton()`：保留给特殊注入场景
- `extractContext()`：提取短上下文信息

## 内置适配

- X/Twitter：`extension/src/adapters/x.ts`

## 设计原则

保持适配器文件职责单一，站点 DOM 变化时可在单文件快速修复。
