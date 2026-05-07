# Architecture

English | [中文版](architecture.md)

Otter is extension-first: the Chrome extension is the only user-facing UI, and FastAPI backend is accessed via a backend client abstraction.

## Layers

- Content scripts: selection menu, hover explain, rewrite UI, adapters
- Service worker: network boundary, config-aware backend client routing
- Backend: SQLite persistence + PromptLoader + LLM calls

## API and compatibility

- All APIs are under `/api/v1/`
- `GET /health` provides compatibility signal
- Extension sends `Client-API-Version`

## Backend modes

- Local: `http://localhost:8000` with optional `Extension-Key`
- Hosted: user-defined compatible API endpoint

## CORS

Use `CORS_ORIGINS` and `CORS_ALLOW_ORIGIN_REGEX` carefully, and treat them as browser-origin controls only (not full security controls).
