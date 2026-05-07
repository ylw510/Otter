import type { Message, SaveWordRequest, Word } from '../types'
import { LOG_PREFIX } from '../brand'
import { WORDS_STORAGE_KEY } from '../types'
import { raceSendMessage } from './messaging'

const SAVE_LOG = `${LOG_PREFIX}[saveWord]`

/**
 * 扩展重载后旧 content script 可能仍处于「僵尸」状态：id 仍有值，但 sendMessage / storage 已不可用。
 * 仅看 id 不够，需同步探测 runtime API；再配合 sendMessage 抛错文案兜底。
 */
export function isExtensionContextValid(): boolean {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
      return false
    }
    chrome.runtime.getManifest()
    return true
  } catch {
    return false
  }
}

/** sendMessage / storage 在上下文失效时的典型错误（id 仍可能非空） */
export function isExtensionContextInvalidatedError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e)
  return /extension context invalidated/i.test(m)
}

const CONTEXT_INVALID_MSG =
  '扩展已重新加载，请刷新本页面后再试（Extension context invalidated）。'

function previewUnknown(res: unknown): string {
  if (res === undefined) return 'undefined'
  if (res === null) return 'null'
  if (typeof res !== 'object') return String(res)
  try {
    return JSON.stringify(res).slice(0, 500)
  } catch {
    return '[object]'
  }
}

function isWordPayload(res: unknown): res is Word {
  return (
    typeof res === 'object' &&
    res !== null &&
    'id' in res &&
    typeof (res as { id?: unknown }).id === 'string' &&
    (res as { id: string }).id.length > 0 &&
    'word' in res &&
    typeof (res as { word?: unknown }).word === 'string'
  )
}

export async function saveWordLocal(data: {
  word: string
  sentence?: string
  source_url: string
  source_site: string
  source_title?: string
}): Promise<Word> {
  if (!isExtensionContextValid()) {
    throw new Error(CONTEXT_INVALID_MSG)
  }
  const word: Word = {
    id: crypto.randomUUID(),
    word: data.word,
    sentence: data.sentence,
    source_url: data.source_url,
    source_title: data.source_title,
    source_site: data.source_site,
    created_at: Date.now(),
    review_count: 0,
    ease_factor: 2.5,
  }

  try {
    const stored = await chrome.storage.local.get(WORDS_STORAGE_KEY)
    const list = (stored[WORDS_STORAGE_KEY] as Word[] | undefined) ?? []
    await chrome.storage.local.set({ [WORDS_STORAGE_KEY]: [word, ...list] })
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) {
      throw new Error(CONTEXT_INVALID_MSG, { cause: e })
    }
    throw e
  }
  console.info(SAVE_LOG, 'stored locally', { id: word.id, word: word.word })
  return word
}

async function mirrorWordsCache(words: Word[]) {
  try {
    await chrome.storage.local.set({ [WORDS_STORAGE_KEY]: words })
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) {
      console.warn(SAVE_LOG, 'mirrorWordsCache skipped (context invalidated)')
      return
    }
    throw e
  }
}

async function readWordsFromStorage(): Promise<Word[]> {
  try {
    const stored = await chrome.storage.local.get(WORDS_STORAGE_KEY)
    return (stored[WORDS_STORAGE_KEY] as Word[] | undefined) ?? []
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) {
      console.warn(SAVE_LOG, 'storage.local.get → invalidated, return []')
    } else {
      console.warn(SAVE_LOG, 'storage.local.get failed', e)
    }
    return []
  }
}

/** 优先写入服务端 SQLite，失败则回落到本地 */
export async function saveWord(data: {
  word: string
  sentence?: string
  source_url: string
  source_site: string
  source_title?: string
}): Promise<Word> {
  const payload: SaveWordRequest = {
    word: data.word,
    sentence: data.sentence,
    source_url: data.source_url,
    source_site: data.source_site,
    source_title: data.source_title,
  }
  const msg: Message<SaveWordRequest> = { type: 'SAVE_WORD', payload }
  let res: (Word & { error?: string }) | undefined
  try {
    res = (await raceSendMessage(msg)) as Word & { error?: string }
  } catch (e) {
    if (!isExtensionContextValid() || isExtensionContextInvalidatedError(e)) {
      console.warn(
        SAVE_LOG,
        'context invalidated (reload extension?) → do not use storage, refresh page',
        e instanceof Error ? e.message : e,
      )
      throw new Error(CONTEXT_INVALID_MSG, { cause: e })
    }
    console.warn(
      SAVE_LOG,
      'sendMessage failed → fallback local',
      e instanceof Error ? e.message : e,
    )
    return saveWordLocal(data)
  }

  /** apiPost 失败时返回 { error, status }；error 可能为空字符串，不能仅用 truthy 判断 */
  if (
    res &&
    typeof res === 'object' &&
    'status' in res &&
    typeof (res as { status?: unknown }).status === 'number'
  ) {
    const err = res as { status: number; error?: string }
    console.warn(SAVE_LOG, 'server HTTP error payload → fallback local', {
      status: err.status,
      error: err.error?.length ? err.error.slice(0, 300) : '(empty)',
    })
    return saveWordLocal(data)
  }

  if (!isWordPayload(res)) {
    console.warn(
      SAVE_LOG,
      'invalid Word payload → fallback local',
      previewUnknown(res),
    )
    return saveWordLocal(data)
  }

  const w = res
  if (!isExtensionContextValid()) {
    throw new Error(CONTEXT_INVALID_MSG)
  }
  try {
    const stored = await chrome.storage.local.get(WORDS_STORAGE_KEY)
    const list = (stored[WORDS_STORAGE_KEY] as Word[] | undefined) ?? []
    await chrome.storage.local.set({
      [WORDS_STORAGE_KEY]: [w, ...list.filter((x) => x.id !== w.id)],
    })
  } catch (e) {
    if (isExtensionContextInvalidatedError(e)) {
      throw new Error(CONTEXT_INVALID_MSG, { cause: e })
    }
    throw e
  }
  console.info(SAVE_LOG, 'server save merged into extension storage', {
    id: w.id,
    word: w.word,
  })
  return w
}

/** 优先从服务端拉取；失败时使用本地缓存（不因 sendMessage 异常而卡住；永不 reject） */
export async function getWords(): Promise<Word[]> {
  try {
    const msg: Message = { type: 'GET_WORDS', payload: {} }
    const res = (await raceSendMessage(msg)) as
      | Word[]
      | { error?: string }
      | undefined

    if (Array.isArray(res)) {
      if (isExtensionContextValid()) {
        await mirrorWordsCache(res)
      }
      return res
    }
  } catch {
    /* Service Worker 未就绪、网络失败等 — 走本地列表 */
  }

  if (!isExtensionContextValid()) {
    console.warn(SAVE_LOG, 'context invalidated → empty list')
    return []
  }

  return readWordsFromStorage()
}
