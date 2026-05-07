# Otter — AI 浏览器副驾

[English](README.en.md) | 中文版

Otter 是一个浏览器内的 AI 英语副驾，让阅读与写作形成闭环：在网页中直接完成划词保存、词汇解释和英文改写。

## 为什么做这个

很多英语工具是割裂的独立应用。Otter 采用浏览器原生形态：Chrome 扩展是唯一用户界面，FastAPI 后端是可替换实现层。

## 核心能力

- 划词保存并记录来源上下文
- 结合句子上下文的 AI 解释
- 中文/不地道英文改写为自然英文（多风格）
- 悬停解释（防抖触发）

## 架构概览

- 扩展仅负责 UI（`extension/`）
- 通过后端客户端抽象切换 Local / Hosted
- FastAPI 后端（`server/`）负责存储和 LLM 调用

## 快速开始

1. 启动后端：
   - `cd server`
   - 创建虚拟环境、安装依赖、配置 `.env`
   - 运行 `uvicorn main:app --reload --host 127.0.0.1 --port 8000`
2. 构建扩展：
   - `cd extension && npm install && npm run build`
3. 在 `chrome://extensions` 开启开发者模式并加载 `extension/dist`
4. 在扩展设置中选择 Local 模式并配置 `http://localhost:8000`

## 更多文档

- 架构：`docs/architecture.en.md` / `docs/architecture.zh.md`
- 隐私：`docs/privacy.en.md` / `docs/privacy.zh.md`
- 安全：`SECURITY.en.md` / `SECURITY.zh.md`
