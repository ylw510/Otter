/** HTTP API prefix — must match server ``main.py`` router mount. */
export const API_PREFIX = '/api/v1' as const

/** Client semantic version for compatibility checks (with ``GET /health``). */
export const CLIENT_API_VERSION = '1' as const
