import type { Message, SaveWordRequest, UpdateWordRequest, Word } from '../types'
import { LOG_PREFIX } from '../brand'
import { raceSendMessage } from './messaging'

const SAVE_LOG = `${LOG_PREFIX}[saveWord]`

const CONTEXT_INVALID_MSG =
  '扩展已重新加载，请刷新本页面后再试（Extension context invalidated）。'

/**
 * 扩展重载后旧 content script 可能仍处于「僵尸」状态：id 仍有值，但 sendMessage / storage 已不可用。
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

export function isExtensionContextInvalidatedError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e)
  return /extension context invalidated/i.test(m)
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

function assertWordResponse(res: unknown, op: string): Word {
  if (
    res &&
    typeof res === 'object' &&
    'error' in res &&
    typeof (res as { error?: unknown }).error === 'string'
  ) {
    throw new Error((res as { error: string }).error)
  }
  if (!isWordPayload(res)) {
    console.warn(SAVE_LOG, `${op} invalid response`, res)
    throw new Error(`${op} failed`)
  }
  return res
}

/** Service Worker 写入 IndexedDB（唯一写库路径） */
export async function saveWord(data: {
  word: string
  sentence?: string
  source_url: string
  source_site: string
  source_title?: string
}): Promise<Word> {
  if (!isExtensionContextValid()) {
    throw new Error(CONTEXT_INVALID_MSG)
  }
  const payload: SaveWordRequest = {
    word: data.word,
    sentence: data.sentence,
    source_url: data.source_url,
    source_site: data.source_site,
    source_title: data.source_title,
  }
  const msg: Message<SaveWordRequest> = { type: 'SAVE_WORD', payload }
  try {
    const res = await raceSendMessage<Word | { error?: string }>(msg)
    return assertWordResponse(res, 'saveWord')
  } catch (e) {
    if (!isExtensionContextValid() || isExtensionContextInvalidatedError(e)) {
      throw new Error(CONTEXT_INVALID_MSG, { cause: e })
    }
    throw e
  }
}

export async function updateWord(
  id: string,
  translation: string,
): Promise<Word> {
  if (!isExtensionContextValid()) {
    throw new Error(CONTEXT_INVALID_MSG)
  }
  const payload: UpdateWordRequest = { id, translation }
  const msg: Message<UpdateWordRequest> = { type: 'UPDATE_WORD', payload }
  try {
    const res = await raceSendMessage<Word | { error?: string }>(msg)
    return assertWordResponse(res, 'updateWord')
  } catch (e) {
    if (!isExtensionContextValid() || isExtensionContextInvalidatedError(e)) {
      throw new Error(CONTEXT_INVALID_MSG, { cause: e })
    }
    throw e
  }
}

export async function getWords(): Promise<Word[]> {
  if (!isExtensionContextValid()) {
    console.warn(SAVE_LOG, 'context invalidated → empty list')
    return []
  }
  try {
    const msg: Message = { type: 'GET_WORDS', payload: {} }
    const res = await raceSendMessage<Word[] | { error?: string }>(msg)
    if (Array.isArray(res)) {
      return res
    }
    if (res && typeof res === 'object' && 'error' in res) {
      console.warn(SAVE_LOG, 'getWords error', res.error)
    }
  } catch (e) {
    console.warn(SAVE_LOG, 'getWords failed', e)
  }
  return []
}
