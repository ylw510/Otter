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
  /** Hover-to-explain/translate; default true when unset. */
  hoverTranslateEnabled: `${APP_SLUG}_hoverTranslateEnabled`,
  /** Session-only: bytes for PDF opened from popup file picker. */
  pendingPdfBytes: `${APP_SLUG}_pendingPdfBytes`,
  pendingPdfName: `${APP_SLUG}_pendingPdfName`,
  pendingPdfUrl: `${APP_SLUG}_pendingPdfUrl`,
} as const

/** Legacy key used before AppConfig; still written for compatibility. */
export const LEGACY_SERVER_URL_KEY = 'serverURL' as const
