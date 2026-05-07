# Otter — 架构设计说明（中文）

[English](design.en.md) | 中文版

## 1. 设计目标

Otter 采用“扩展优先”的产品形态：浏览器扩展是唯一用户交互界面，后端作为可替换能力层，负责数据存储、LLM 调用与接口编排。  
核心目标是把阅读与写作增强能力嵌入真实网页，不让用户在多个工具之间切换。

## 2. 整体架构（分层）

### 2.1 Extension UI 层（Content Script + Popup）

- 内容脚本负责页面内交互：划词菜单、改写入口、解释触发等。
- Popup 负责词表与复习等聚合视图。
- UI 层不直接耦合后端地址与鉴权细节，通过消息交给 Service Worker。

### 2.2 Extension 网关层（Service Worker）

- `extension/src/background/service-worker.ts` 是扩展内唯一网络出口。
- 统一接收消息：`REWRITE_TEXT`、`EXPLAIN_TEXT`、`SAVE_WORD`、`GET_WORDS`、`GET_REVIEW_NEXT`、`SUBMIT_REVIEW`。
- 负责超时控制（15s）、错误兜底、日志记录，以及命令事件（如 `open-review`）转发。

### 2.3 Backend Client 抽象层（Local / Hosted）

- `extension/src/backend/backendClient.ts` 定义统一 `BackendClient` 契约。
- 通过 `createBackendClient(config, fetchWithTimeout)` 按 `backendMode` 选择实现：
  - `LocalHttpBackendClient`：可附加 `Extension-Key`（来自 `localApiKey`）。
  - `HostedHttpBackendClient`：默认不携带扩展侧密钥。
- 所有请求统一带 `Client-API-Version`，并访问 `/api/v1/*`。

### 2.4 FastAPI 应用层

- 入口：`server/main.py`。
- 路由统一挂载在 `/api/v1`：
  - `/rewrite`
  - `/explain`
  - `/words`
  - `/review/next`
  - `/review/answer`
- 健康检查：`GET /health` 返回 `ok`、`api_version`、`service`。

### 2.5 数据与模型层

- 持久化通过 `init_db()` 初始化，默认 SQLite（由 `DATABASE_URL` 决定）。
- 词条与复习数据由 `words` / `review` 路由读写。
- LLM 能力由后端服务层统一调用，扩展不持有 Provider 密钥。

## 3. 层间交互（关键链路）

### 3.1 改写/解释链路

1. 用户在页面或输入框触发改写/解释。  
2. Content Script 向 Service Worker 发送消息。  
3. Service Worker 加载配置并创建对应 Backend Client。  
4. Backend Client 调用 `/api/v1/rewrite` 或 `/api/v1/explain`。  
5. 后端完成 LLM 处理并返回结果。  
6. Service Worker 将结果回传给 UI 渲染。

### 3.2 保存单词链路

1. 用户触发保存，内容脚本组织 `word/sentence/source_*`。  
2. Service Worker 接收 `SAVE_WORD` 并发起 `/api/v1/words`。  
3. 后端写入数据库并返回标准对象。  
4. 扩展侧根据响应更新展示或执行失败兜底。

### 3.3 复习链路

1. Popup 请求 `GET_REVIEW_NEXT`。  
2. Service Worker 代理到 `/api/v1/review/next`。  
3. 用户提交评分后发送 `SUBMIT_REVIEW`。  
4. 后端通过 `/api/v1/review/answer` 更新复习调度状态。

## 4. 架构约束与边界

- API 前缀固定为 `/api/v1`，扩展与后端通过版本头协同演进。  
- CORS 由后端统一配置（`CORS_ORIGINS` + `CORS_ALLOW_ORIGIN_REGEX`）。  
- 安全边界在后端：模型密钥与真实调用逻辑不进入扩展端。  
- 扩展内仅维护“消息层 + 客户端抽象层”，保证本地/托管模式可平滑切换。