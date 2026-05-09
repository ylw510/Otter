# Otter — Chrome extension

[中文](README.zh.md)

This directory contains the only end-user UI for Otter.

## Development

- `npm install`
- `npm run dev`

Load `extension/dist` in `chrome://extensions` (Developer mode -> Load unpacked).

## Build

Inside **`extension/`**:

- `npm ci` (or `npm install`)
- `npm run build`
- Output: `dist/` (i.e. `extension/dist/` from the repo root)

From the **repository root**, use **`./otter-extension.sh`** (defaults: unpacked **`build/extension/`**, zip **`build/releases/`**; flags `-o`, `pack --dist`; run `./otter-extension.sh help`).

Equivalent npm: `npm run install:extension`, `npm run build:extension`, `npm run pack:extension`.

Advanced (VMware/shared path): run `npm run build:shared` / `pack:shared` inside **`extension/`** with env vars — see `scripts/shared-artifacts.mjs`.
