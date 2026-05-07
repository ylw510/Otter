# 架构说明

[English](architecture.en.md)

Otter 采用扩展优先架构：Chrome 扩展是唯一用户界面，FastAPI 后端通过后端客户端抽象接入。

## 分层

- 内容脚本：划词菜单、悬停解释、改写 UI、站点适配器
- Service Worker：网络边界与后端路由
- 后端：SQLite 持久化、PromptLoader 渲染、LLM 调用

## API 与兼容

- 业务接口统一在 `/api/v1/`
- `GET /health` 用于兼容性检查
- 扩展请求携带 `Client-API-Version`

## 后端模式

- Local：默认 `http://localhost:8000`，可选 `Extension-Key`
- Hosted：用户自定义兼容 API 地址

## CORS

`CORS_ORIGINS` 与 `CORS_ALLOW_ORIGIN_REGEX` 仅是浏览器来源控制，不能替代鉴权、TLS 与网络隔离。
