import { API_PREFIX } from '../api/version'
import { createBackendClient } from '../backend'
import { LOG_PREFIX } from '../brand'
import { loadAppConfig } from '../config/appConfig'
import { DEFAULT_LOCAL_API_BASE } from '../constants'
import type {
  ExplainRequest,
  Message,
  ReviewAnswer,
  RewriteRequest,
  SaveWordRequest,
} from '../types'

/** Avoid hung fetch when the backend is down so popup never spins forever. */
const API_TIMEOUT_MS = 15_000
const SAVE_LOG = `${LOG_PREFIX}[saveWord]`

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function handleMessage(message: Message): Promise<unknown> {
  const cfg = await loadAppConfig()
  const client = createBackendClient(cfg, fetchWithTimeout)

  switch (message.type) {
    case 'REWRITE_TEXT': {
      const payload = message.payload as RewriteRequest
      return client.rewrite(payload)
    }
    case 'EXPLAIN_TEXT': {
      const payload = message.payload as ExplainRequest
      return client.explain(payload)
    }
    case 'SAVE_WORD': {
      const payload = message.payload as SaveWordRequest
      const base = (
        cfg.apiBaseUrl?.trim() || DEFAULT_LOCAL_API_BASE
      ).replace(/\/$/, '')
      const url = `${base}${API_PREFIX}/words`
      console.info(`${SAVE_LOG} POST`, url, {
        word: payload.word,
        source_site: payload.source_site,
      })
      try {
        const out = await client.saveWord(payload)
        if (
          out &&
          typeof out === 'object' &&
          'status' in out &&
          typeof (out as { status?: unknown }).status === 'number'
        ) {
          const e = out as { status: number; error?: string }
          console.warn(`${SAVE_LOG} HTTP not OK`, {
            url,
            status: e.status,
            body: e.error?.length ? e.error.slice(0, 400) : '(empty)',
          })
        } else if (
          out &&
          typeof out === 'object' &&
          'id' in out &&
          'word' in out
        ) {
          const w = out as { id: string; word: string }
          console.info(`${SAVE_LOG} HTTP OK`, {
            id: w.id,
            word: w.word,
          })
        } else {
          console.warn(`${SAVE_LOG} unexpected response shape`, out)
        }
        return out
      } catch (e) {
        console.error(`${SAVE_LOG} request failed`, url, e)
        throw e
      }
    }
    case 'GET_WORDS':
      return client.getWords()
    case 'GET_REVIEW_NEXT':
      return client.getReviewNext()
    case 'SUBMIT_REVIEW': {
      const payload = message.payload as ReviewAnswer
      return client.submitReview(payload)
    }
    default:
      return { error: 'Unknown message type' }
  }
}

chrome.runtime.onMessage.addListener(
  (message: Message, _s, sendResponse) => {
    void handleMessage(message)
      .then(sendResponse)
      .catch((e: unknown) => {
        sendResponse({ error: e instanceof Error ? e.message : String(e) })
      })
    return true
  },
)

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-review') return
  void chrome.storage.session.set({ openReview: true }).then(() => {
    void chrome.action.openPopup?.()
  })
})

export {}
