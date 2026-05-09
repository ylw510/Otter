# Otter — AI Browser Copilot

English | [中文版](README.md)

Otter is an AI browser copilot that keeps reading and writing in one loop: save selections, explain vocabulary, and rewrite text into natural English directly on the page.

## Why this exists

Most English tools are isolated apps. Otter is browser-native: the Chrome extension is the only product UI, and the FastAPI backend is a swappable implementation detail.

## Core capabilities

- Selection save with source context
- AI explain with sentence context
- Chinese/broken-English to native-English rewrite (multi-style)
- Hover explain with debounce

## Architecture

- Extension UI only (`extension/`)
- Backend client abstraction (Local/Hosted)
- FastAPI backend (`server/`) for persistence + LLM calls

## Quick start

1. Start backend:
   - `cd server`
   - create venv, install requirements, configure `.env`
   - `./run.sh` (defaults **`0.0.0.0:8000`**; **`--reload`** makes uvicorn restart when server code changes—no manual restart). Override: `./run.sh --host 127.0.0.1 --port 8000`, or env `OTTER_HOST` / `OTTER_PORT`. From repo root: `./server/run.sh`.
2. Build extension (**from the repo root**):
   - **Recommended**: `./otter-extension.sh` (see `./otter-extension.sh help`)
   - First-time: `./otter-extension.sh install`, then `./otter-extension.sh build`
   - **Defaults**: unpacked extension → **`build/extension/`**; zip → **`build/releases/otter-extension.zip`**
   - Custom output: `./otter-extension.sh build -o /path/to/unpacked`, `./otter-extension.sh pack -o ~/Downloads` (directory → zip name inside), or `pack -o ./out/foo.zip`
   - Pin build dir for pack: `./otter-extension.sh pack --dist ./out/ext -o ./out/foo.zip`
   - Unpacked only, no zip (e.g. VMware share): `./otter-extension.sh pack -o /mnt/hgfs/Share --no-zip` → **`/mnt/hgfs/Share/otter-extension/`** (or use `--dist` for an explicit path)
   - Equivalent: `npm run install:extension`, `npm run build:extension`, `npm run pack:extension` (root `package.json`)
   - If you run `npm run build` **inside `extension/`**, output stays **`extension/dist/`** (local dev workflow)
3. Load **`build/extension/`** in `chrome://extensions` when using the root scripts; load **`extension/dist`** if you built inside `extension/`.
4. In extension settings, set Local mode + `http://localhost:8000`.

## More docs

- Architecture: `docs/architecture.en.md` / `docs/architecture.zh.md`
- Privacy: `docs/privacy.en.md` / `docs/privacy.zh.md`
