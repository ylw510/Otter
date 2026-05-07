# 数据模型（服务端）

[English](data-model.en.md)

默认使用 SQLite（`DATABASE_URL`），SQLAlchemy 模型位于 `server/app/models/`。

## 主要数据表

- `words`：词条、上下文、来源信息、SM-2 复习字段
- `rewrite_history`：原文、改写结果、风格、站点、创建时间
- `user_preferences`：为未来账号/同步偏好预留

## 扩展侧镜像

扩展会将词表缓存到 `chrome.storage.local` 用于离线体验；服务端可用时仍是主数据源。
