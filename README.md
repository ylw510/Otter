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

### 前置安装

| 平台 | 依赖 | 最低版本 | 备注 |
|------|------|---------|------|
| Linux / macOS | Python | 3.11+ | `python3 --version` |
| Linux / macOS | Node.js | 20+ | `node --version` |
| Windows | Python | 3.11+ | 需从 [python.org](https://www.python.org/downloads/) 安装，**不要用** Microsoft Store 版本；安装时勾选 "Add Python to PATH" |
| Windows | Node.js | 20+ | 从 [nodejs.org](https://nodejs.org/) 安装 |

验证安装：

```bash
python --version    # Linux/macOS 用 python3 --version
node --version
npm --version
```

> Windows 用户注意：Microsoft Store 提供的 Python 是存根（仅跳转到 Store），功能不完整。请从 python.org 下载官方安装包。

### Linux / macOS

1. 启动后端：
   - `cd server`
   - 创建虚拟环境、安装依赖、配置 `.env`
   - `./run.sh`（默认 **`0.0.0.0:8000`**；启用 **`--reload`**：修改后端代码后 uvicorn 会自动重启进程，无需手动停启）。自定义：`./run.sh --host 127.0.0.1 --port 8000`，或环境变量 `OTTER_HOST` / `OTTER_PORT`。也可在仓库根目录执行 `./server/run.sh`。
2. 构建扩展（**在仓库根目录**，无需先 `cd extension`）：
   - **推荐**：`./otter-extension.sh`（见 `./otter-extension.sh help`）
   - 首次：`./otter-extension.sh install`，再 `./otter-extension.sh build`
   - **默认产物**：未打包扩展 → **`build/extension/`**；zip → **`build/releases/otter-extension.zip`**
   - 自定义产物输出目录：`./otter-extension.sh build -o /路径/扩展目录`、`./otter-extension.sh pack -o ~/Downloads`（目录则自动生成 zip 文件名）、或 `pack -o ./out/foo.zip`
   - 打包前指定构建输出：`./otter-extension.sh pack --dist ./out/ext -o ./out/foo.zip`
   - 只要未打包目录、不要 zip（例如输出到 VMware 共享盘）：`./otter-extension.sh pack -o /mnt/hgfs/Share --no-zip` → 扩展目录为 **`/mnt/hgfs/Share/otter-extension/`**（也可用 `--dist` 指定完整路径）
   - 若在 **`extension/`** 内直接 `npm run build`，产物仍为 **`extension/dist/`**（供本地开发）
3. 在 `chrome://extensions` 开启开发者模式并加载 **`build/extension/`**（若使用上述根目录命令）；若在 `extension/` 内构建则加载 **`extension/dist`**
4. 在扩展设置中选择 Local 模式并配置 `http://localhost:8000`

### Windows

Otter 支持 Windows（Git Bash / PowerShell / WSL）下的构建。**开始前请确认上方「前置安装」中的依赖已就绪。**

1. **后端**（PowerShell 或 Git Bash）：
   - `cd server`
   - 创建虚拟环境：`python -m venv .venv`
   - 安装依赖（PowerShell）：`.venv\Scripts\pip install -r requirements.txt`
   - 安装依赖（Git Bash）：`.venv/Scripts/pip install -r requirements.txt` 或在 `server` 目录执行 `python -m pip install -r requirements.txt`
   - 启动：`run.bat`（默认 `0.0.0.0:8000`，支持 `--reload`），或手动 `.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

2. **构建扩展**（PowerShell 或 Git Bash，**在仓库根目录**）：
   - 首次安装依赖：`npm run install:extension`
   - 构建：`npm run build:extension`
   - 打包：`npm run pack:extension`
   - 自定义输出：`npm run build:extension -- -o 输出目录`
   - 若在 `extension/` 内直接 `npm run build`，产物为 **`extension/dist/`**

3. 在 `chrome://extensions` 开启开发者模式并加载 **`build/extension/`**（若使用根目录命令）或 **`extension/dist`**
4. 在扩展设置中选择 Local 模式并配置 `http://localhost:8000`

> **注意**：Windows 下打包 zip 使用 .NET `System.IO.Compression`（无需额外安装工具）；`npm run` 命令与 Linux/macOS 行为一致。

## 更多文档

- 构建问题排查：`docs/build-troubleshooting.md` / `docs/build-troubleshooting.en.md`
- 架构：`docs/architecture.en.md` / `docs/architecture.zh.md`
- 隐私：`docs/privacy.en.md` / `docs/privacy.zh.md`
- 扩展图标：`docs/design-icons.md`
