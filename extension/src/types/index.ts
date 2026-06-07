// ===== 核心数据模型（与 design.md 对齐） =====
// 用 `type` 避免与全局 interface 声明合并（曾导致 string 与 Object 不兼容的 tsc 报错）。

export type BackendMode = 'local' | 'hosted'

export type Word = {
  id: string
  user_id?: string
  word: string
  sentence?: string
  context_sentence?: string
  explanation?: string
  translation?: string
  source_url?: string
  source_title?: string
  source_site?: string
  created_at: number
  review_count: number
  next_review_at?: number
  ease_factor: number
  interval?: number
}

export type TranslateRequest = {
  text: string
  sentence?: string
  source_lang?: string
  target_lang?: string
}

export type TranslateResponse = {
  translation: string
}

export type ExplainRequest = {
  text: string
  sentence?: string
}

export type ExplainResponse = {
  explanation: string
  example?: string
}

export type SaveWordRequest = {
  word: string
  sentence?: string
  source_url: string
  source_site: string
  source_title?: string
}

export type RewriteResult = {
  style: RewriteStyle
  text: string
}

export type RewriteStyle =
  | 'professional'
  | 'native'
  | 'casual'
  | 'twitter_tech'

export type MessageType =
  | 'SAVE_WORD'
  | 'REWRITE_TEXT'
  | 'EXPLAIN_TEXT'
  | 'TRANSLATE_TEXT'
  | 'GET_WORDS'
  | 'GET_REVIEW_NEXT'
  | 'SUBMIT_REVIEW'

export type Message<T = unknown> = {
  type: MessageType
  payload: T
}

export type RewriteRequest = {
  text: string
  styles?: RewriteStyle[]
}

export type RewriteResponse = {
  results: RewriteResult[]
}

export const WORDS_STORAGE_KEY = 'copilot_words' as const

export const DEFAULT_STYLES: RewriteStyle[] = [
  'professional',
  'native',
  'casual',
  'twitter_tech',
]

export type ReviewItem = {
  word_id: string
  word: string
  sentence?: string
  explanation?: string
}

export type ReviewAnswer = {
  word_id: string
  quality: 0 | 1 | 2 | 3 | 4 | 5
}
