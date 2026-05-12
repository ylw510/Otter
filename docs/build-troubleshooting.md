# 构建问题排查

本文记录 Otter **前端（Chrome 扩展）**与**后端（FastAPI）**在本地构建、安装依赖时常见问题及处理方式。推荐环境以仓库根目录 [README.md](../README.md) 中的「前置安装」为准。

---

## 前端构建（Chrome 扩展）

目录：`extension/`；根目录封装命令：`npm run install:extension` / `build:extension` / `pack:extension`（等价于 `./otter-extension.sh`，Linux/macOS）。

### 推荐环境

- **Node.js 20+**（与 CI 一致）
- 扩展依赖安装在 **`extension/node_modules`**；请在**仓库根目录**执行根级 `npm` 脚本，或进入 `extension/` 后使用其 `package.json` 中的脚本

### 常见问题

#### 1. `npm ci` / `npm install` 报错或脚本找不到

- 确认当前目录：根目录脚本使用 `npm --prefix extension`，**不要在错误的目录**重复执行导致两套 `node_modules` 混乱。
- 若锁文件与 `package.json` 不一致，在 `extension/` 内可改用 `npm install` 再提交更新后的锁文件（团队流程以项目约定为准）。

#### 2. Windows 下 `npm run pack:extension` 失败

打包脚本在 **Windows** 上会调用 **PowerShell** 与 .NET `System.IO.Compression` 生成 zip（见 `extension/scripts/pack-zip.mjs`）。请确认：

- 系统可执行 `powershell`（默认可用）；
- 输出路径中尽量避免未被脚本转义的**单引号**等特殊字符（脚本已对路径中的 `'` 做了转义，异常路径若仍失败可换简单路径重试）。

#### 3. Linux / macOS 下打包失败：`zip: command not found`

在非 Windows 平台上，zip 依赖系统自带的 **`zip`** 命令（Info-ZIP）。若未安装：

- **Debian/Ubuntu**：`sudo apt install zip`
- **macOS**：通常已自带；若使用精简环境，可通过 Homebrew 安装 `zip`

#### 4. `sharp`（图标等）安装失败

`sharp` 会下载平台对应的预编译二进制。若代理或网络导致下载失败，可检查网络、镜像或公司防火墙；极少数环境需满足 `sharp` 文档中的**本机构建**条件（一般不必）。

#### 5. 构建产物应该加载哪个目录？

- 使用根目录 **`npm run build:extension`**（或 `pack`）：默认未打包目录为 **`build/extension/`**。
- 仅在 **`extension/`** 内执行 `npm run build`：产物为 **`extension/dist/`**。在 `chrome://extensions` 中加载对应目录即可。

---

## 后端构建（Python / FastAPI）

目录：`server/`；依赖见 `server/requirements.txt`。CI 使用 **Python 3.11**。

### 推荐环境

- **Python 3.11 或 3.12**（与 CI 一致，且 PyPI 上主要依赖均有成熟 **wheel**）
- Windows 请使用 [python.org](https://www.python.org/downloads/) 官方安装包，**避免**仅依赖 Microsoft Store 的 Python 存根（见主 README「前置安装」）。

### 常见问题

#### 1. Windows：`pip install -r requirements.txt` 长时间卡在 `pydantic-core`（已记录案例）

**现象**

- 安装耗时明显偏长（例如超过十余分钟仍无进展），或长时间停在：
  - `Preparing metadata (pyproject.toml)`
  - `Building wheel for pydantic-core`
- 使用 **`pip install -v -r requirements.txt`** 时，可看到下载的是 **`pydantic_core-*.tar.gz`**（源码包），而不是 **`pydantic_core-*-cp311-win_amd64.whl`** 这类 wheel。

**原因**

- 项目通过 **`pydantic==2.7.1`** 间接依赖固定版本的 **`pydantic-core`**（例如 2.18.2）。`pydantic-core` 的核心由 **Rust** 实现，正常情况下安装的是**预编译 wheel**。
- 在 **较新的 Python 版本（例如 3.14）+ Windows** 等组合下，PyPI 上可能**尚未提供**对应平台的 wheel，pip 会改为从 **sdist（源码）** 构建，从而拉取 **maturin**、**Rust 工具链（rustup）** 并在本机 **cargo 编译**，耗时很长且对环境（如 MSVC 构建工具）有额外要求。

**如何自行验证是否为「Rust 源码构建」路径**

- 日志中出现 **`pydantic_core-*.tar.gz`**，且出现 **`maturin`**、`**rustc**` / **`rustup`** / **`x86_64-pc-windows-msvc`** 等字样。
- 任务管理器中在卡住阶段可能出现 **`rustc.exe`**、**`cargo.exe`** 且 CPU 占用较高。

**处理建议（推荐）**

- **改用 Python 3.11 或 3.12** 新建虚拟环境，再执行 `pip install -r requirements.txt`。成功时应看到下载 **`pydantic_core-...-cp311-...win_amd64.whl`**（或 312），安装应在较短时间内完成。
- 若必须使用更新版本的 Python，需接受可能的源码编译，并安装 **Visual Studio Build Tools（MSVC + Windows SDK）** 与 **Rust**，且仍可能较慢——**不推荐**作为日常开发默认路径。

#### 2. 虚拟环境已创建但 `run.bat` / `run.sh` 提示缺依赖

按脚本提示在已激活的 venv 中执行：

```text
pip install -r requirements.txt
```

Windows 下未激活时也可使用：`server\.venv\Scripts\pip install -r requirements.txt`（路径以你本机为准）。

#### 3. Linux/macOS 与 Windows 启动方式不同

- **Linux/macOS**：`server/run.sh`（Bash）。
- **Windows**：`server/run.bat` 或手动 `uvicorn main:app --reload`（需先激活 venv 或使用 `Scripts\uvicorn.exe`）。

---

若你遇到本文未覆盖的构建问题，欢迎在 Issue 中附上：**操作系统、Python/Node 精确版本、完整命令与（必要时）`pip install -v` 或 npm 错误日志**（注意脱敏 token）。
