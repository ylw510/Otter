import type { Word } from '../types'

/** User-edited translation takes precedence over AI explanation for display. */
export function wordMeaning(word: Pick<Word, 'translation' | 'explanation'>): string {
  const t = word.translation?.trim()
  if (t) return t
  return word.explanation?.trim() ?? ''
}
