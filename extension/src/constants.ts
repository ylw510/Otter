import { APP_SLUG } from './brand'

/** Default API base when none is stored (self-hosted on localhost). */
export const DEFAULT_LOCAL_API_BASE = 'http://localhost:8000'

/** @deprecated Use DEFAULT_LOCAL_API_BASE — kept for gradual migration */
export const DEFAULT_SERVER_URL = DEFAULT_LOCAL_API_BASE

/** chrome.storage.local keys for AppConfig (avoid collisions). */
export const STORAGE_KEYS = {
  backendMode: `${APP_SLUG}_backendMode`,
  apiBaseUrl: `${APP_SLUG}_apiBaseUrl`,
  localApiKey: `${APP_SLUG}_localApiKey`,
} as const

/** Legacy key used before AppConfig; still written for compatibility. */
export const LEGACY_SERVER_URL_KEY = 'serverURL' as const
