# Data model (server)

English | [中文版](data-model.md)

SQLite is used by default (`DATABASE_URL`), with SQLAlchemy models in `server/app/models/`.

## Main tables

- `words`: vocabulary item, context, source metadata, and SM-2 review fields
- `rewrite_history`: original text, rewritten text, style, site, created time
- `user_preferences`: reserved for future account/sync preferences

## Extension mirror

The extension caches words in `chrome.storage.local` for offline UX, while the server remains source of truth when available.
