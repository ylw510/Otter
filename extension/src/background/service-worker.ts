import { createBackendClient } from '../backend'
import { LOG_PREFIX } from '../brand'
import { loadAppConfig } from '../config/appConfig'
import {
  trySyncSaveWord,
  trySyncUpdateWord,
} from './optionalServerSync'
import {
  createWord,
  getNextDueReview,
  listWords,
  submitReviewAnswer,
  updateWordTranslation,
} from '../repository/wordRepository'
import { notifyWordsChanged } from './wordsChanged'
import type {
  ExplainRequest,
  Message,
  ReviewAnswer,
  RewriteRequest,
  SaveWordRequest,
  UpdateWordRequest,
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
      const word = await createWord(payload)
      notifyWordsChanged()
      console.info(SAVE_LOG, 'stored in IndexedDB', {
        id: word.id,
        word: word.word,
      })
      void trySyncSaveWord(word, payload)
      return word
    }
    case 'UPDATE_WORD': {
      const payload = message.payload as UpdateWordRequest
      const word = await updateWordTranslation(payload.id, payload.translation)
      notifyWordsChanged()
      void trySyncUpdateWord(payload)
      return word
    }
    case 'GET_WORDS':
      return listWords()
    case 'GET_REVIEW_NEXT': {
      const item = await getNextDueReview()
      return { item }
    }
    case 'SUBMIT_REVIEW': {
      const payload = message.payload as ReviewAnswer
      const word = await submitReviewAnswer(payload)
      notifyWordsChanged()
      return word
    }
    default:
      return { error: 'Unknown message type' }
  }
}

chrome.runtime.onMessage.addListener(
  (message: Message, _s, sendResponse) => {
    if (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      (message as { type: string }).type === 'WORDS_CHANGED'
    ) {
      return false
    }
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
