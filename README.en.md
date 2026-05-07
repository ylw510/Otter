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
   - run `uvicorn main:app --reload --host 127.0.0.1 --port 8000`
2. Build extension:
   - `cd extension && npm install && npm run build`
3. Load `extension/dist` in `chrome://extensions` (Developer mode).
4. In extension settings, set Local mode + `http://localhost:8000`.

## More docs

- Architecture: `docs/architecture.en.md` / `docs/architecture.zh.md`
- Privacy: `docs/privacy.en.md` / `docs/privacy.zh.md`
