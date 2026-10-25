import { createBackendClient } from '../backend'
import { loadAppConfig } from '../config/appConfig'
import { DEFAULT_LOCAL_API_BASE } from '../constants'
import type { SaveWordRequest, UpdateWordRequest, Word } from '../types'

const SYNC_TIMEOUT_MS = 8_000

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function isBackendReachable(apiBase: string): Promise<boolean> {
  const base = apiBase.replace(/\/$/, '')
  try {
    const res = await fetchWithTimeout(`${base}/health`, { method: 'GET' })
    if (!res.ok) return false
    const body = (await res.json()) as { ok?: boolean }
    return body.ok === true
  } catch {
    return false
  }
}

function isHttpError(res: unknown): res is { status: number } {
  return (
    typeof res === 'object' &&
    res !== null &&
    'status' in res &&
    typeof (res as { status?: unknown }).status === 'number'
  )
}

/** Best-effort mirror to server; never throws to callers. */
export async function trySyncSaveWord(
  local: Word,
  payload: SaveWordRequest,
): Promise<void> {
  const cfg = await loadAppConfig()
  const base = (cfg.apiBaseUrl?.trim() || DEFAULT_LOCAL_API_BASE).replace(
    /\/$/,
    '',
  )
  if (!(await isBackendReachable(base))) return

  const client = createBackendClient(cfg, fetchWithTimeout)
  try {
    const out = await client.saveWord(payload)
    if (isHttpError(out)) return
    if (typeof out === 'object' && out !== null && 'id' in out) {
      console.info('[Otter][sync] saved word to server', {
        localId: local.id,
        serverId: (out as Word).id,
      })
    }
  } catch (e) {
    console.warn('[Otter][sync] saveWord skipped', e)
  }
}

export async function trySyncUpdateWord(
  payload: UpdateWordRequest,
): Promise<void> {
  const cfg = await loadAppConfig()
  const base = (cfg.apiBaseUrl?.trim() || DEFAULT_LOCAL_API_BASE).replace(
    /\/$/,
    '',
  )
  if (!(await isBackendReachable(base))) return

  const client = createBackendClient(cfg, fetchWithTimeout)
  try {
    const out = await client.updateWord(payload)
    if (isHttpError(out)) return
  } catch (e) {
    console.warn('[Otter][sync] updateWord skipped', e)
  }
}
