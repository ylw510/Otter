# Otter — Chrome 扩展

[English](README.en.md)

该目录是 Otter 面向用户的唯一 UI。

## 开发

- `npm install`
- `npm run dev`

在 `chrome://extensions` 打开开发者模式，加载 `extension/dist`。

## 构建

在 **`extension/`** 目录下：

- `npm ci`（或 `npm install`）
- `npm run build`
- 产物目录：`dist/`（即仓库根的 `extension/dist/`）

也可在**仓库根目录**使用 **`./otter-extension.sh`**（默认未打包产物在仓库根 **`build/extension/`**，zip 在 **`build/releases/`**；支持 `-o` / `--out`、`pack --dist`，见脚本帮助）。

等价 npm：`npm run install:extension`、`npm run build:extension`、`npm run pack:extension`。

高级：需输出到固定挂载目录（如 VMware 共享盘）时，可在 **`extension/`** 内设置环境变量执行 `npm run build:shared` / `pack:shared`，见 `scripts/shared-artifacts.mjs`。
