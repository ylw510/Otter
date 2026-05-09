import {
  DEFAULT_LOCAL_API_BASE,
  LEGACY_SERVER_URL_KEY,
  STORAGE_KEYS,
} from '../constants'
import type { BackendMode } from '../types'

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

export type AppConfig = {
  backendMode: BackendMode
  apiBaseUrl: string
  /** Optional gate key sent only from Local mode builds (see Settings UI). */
  localApiKey?: string
  /** Mouse hover triggers explain/translate tooltip; default true. */
  hoverTranslateEnabled: boolean
}

/** Treat missing storage as enabled (default-on). */
export function normalizeHoverTranslateEnabled(v: unknown): boolean {
  return v !== false
}

export async function loadAppConfig(): Promise<AppConfig> {
  const r = await chrome.storage.local.get([
    STORAGE_KEYS.backendMode,
    STORAGE_KEYS.apiBaseUrl,
    STORAGE_KEYS.localApiKey,
    STORAGE_KEYS.hoverTranslateEnabled,
    LEGACY_SERVER_URL_KEY,
  ])

  let apiBaseUrl = str(r[STORAGE_KEYS.apiBaseUrl])?.trim() ?? ''

  const legacy = str(r[LEGACY_SERVER_URL_KEY])?.trim()
  if (!apiBaseUrl && legacy) {
    apiBaseUrl = legacy
  }

  if (!apiBaseUrl) {
    apiBaseUrl = DEFAULT_LOCAL_API_BASE
  }

  const backendMode: BackendMode =
    str(r[STORAGE_KEYS.backendMode]) === 'hosted' ? 'hosted' : 'local'

  const localApiKey = str(r[STORAGE_KEYS.localApiKey])

  const hoverTranslateEnabled = normalizeHoverTranslateEnabled(
    r[STORAGE_KEYS.hoverTranslateEnabled],
  )

  return { backendMode, apiBaseUrl, localApiKey, hoverTranslateEnabled }
}

export async function saveAppConfig(cfg: AppConfig): Promise<void> {
  const prev = await loadAppConfig()
  const keyToStore: string =
    cfg.backendMode === 'local'
      ? (cfg.localApiKey ?? '')
      : (prev.localApiKey ?? '')

  await chrome.storage.local.set({
    [STORAGE_KEYS.backendMode]: cfg.backendMode,
    [STORAGE_KEYS.apiBaseUrl]: cfg.apiBaseUrl.trim() || DEFAULT_LOCAL_API_BASE,
    [STORAGE_KEYS.localApiKey]: keyToStore,
    [STORAGE_KEYS.hoverTranslateEnabled]: cfg.hoverTranslateEnabled,
    [LEGACY_SERVER_URL_KEY]: cfg.apiBaseUrl.trim() || DEFAULT_LOCAL_API_BASE,
  })
}
