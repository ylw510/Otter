# 数据模型（服务端）

[English](data-model.en.md)

默认使用 SQLite（`DATABASE_URL`），SQLAlchemy 模型位于 `server/app/models/`。

## 主要数据表

- `words`：词条、上下文、来源信息、SM-2 复习字段
- `rewrite_history`：原文、改写结果、风格、站点、创建时间
- `user_preferences`：为未来账号/同步偏好预留

## 扩展侧存储

词条与复习调度保存在扩展 **IndexedDB**（`otter` 数据库，`words` 表），由 Service Worker 统一读写。`chrome.storage.local` 仅用于应用配置。服务端为可选同步与 AI 能力，非词表前置条件。
