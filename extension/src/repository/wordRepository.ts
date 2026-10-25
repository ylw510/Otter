import { otterDb } from '../db/otterDb'
import { calculateNextReview } from '../review/calculateNextReview'
import { ratingToQuality } from '../review/rating'
import type {
  ReviewAnswer,
  ReviewItem,
  SaveWordRequest,
  Word,
} from '../types'

export function wordToReviewItem(row: Word): ReviewItem {
  return {
    word_id: row.id,
    word: row.word,
    sentence: row.sentence,
    explanation: row.explanation,
    translation: row.translation,
  }
}

export async function createWord(input: SaveWordRequest): Promise<Word> {
  const now = Date.now()
  const word: Word = {
    id: crypto.randomUUID(),
    word: input.word,
    sentence: input.sentence,
    source_url: input.source_url,
    source_title: input.source_title,
    source_site: input.source_site,
    created_at: now,
    review_count: 0,
    ease_factor: 2.5,
    interval: 1,
    next_review_at: now,
  }
  await otterDb.words.put(word)
  return word
}

export async function listWords(): Promise<Word[]> {
  return otterDb.words.orderBy('created_at').reverse().toArray()
}

export async function updateWordTranslation(
  id: string,
  translation: string,
): Promise<Word> {
  const row = await otterDb.words.get(id)
  if (!row) {
    throw new Error('词条不存在')
  }
  const trimmed = translation.trim()
  const updated: Word = {
    ...row,
    translation: trimmed || undefined,
  }
  await otterDb.words.put(updated)
  return updated
}

export async function getNextDueReview(): Promise<ReviewItem | null> {
  const now = Date.now()
  const row = await otterDb.words
    .where('next_review_at')
    .belowOrEqual(now)
    .sortBy('next_review_at')
  const first = row[0]
  return first ? wordToReviewItem(first) : null
}

export async function submitReviewAnswer(
  payload: ReviewAnswer,
): Promise<Word> {
  const row = await otterDb.words.get(payload.word_id)
  if (!row) {
    throw new Error('词条不存在')
  }
  const now = Date.now()
  const interval = row.interval ?? 1
  const quality = ratingToQuality(payload.rating)
  const [newDays, newEase, newRc] = calculateNextReview(
    quality,
    row.ease_factor,
    interval,
    row.review_count,
  )
  const updated: Word = {
    ...row,
    review_count: newRc,
    ease_factor: newEase,
    interval: newDays,
    next_review_at: now + newDays * 86_400_000,
  }
  await otterDb.words.put(updated)
  return updated
}

export async function getWordById(id: string): Promise<Word | undefined> {
  return otterDb.words.get(id)
}
