import { DEFAULT_NEW_WORD_PHASE, otterDb } from '../db/otterDb'
import { initWordFsrsCard } from '../review/fsrsCardBridge'
import { applyReviewRating, PHASE_QUEUE_PRIORITY } from '../review/applyReviewRating'
import { previewReviewOutcomes } from '../review/previewReviewOutcomes'
import type {
  ReviewAnswer,
  ReviewItem,
  ReviewOutcomePreview,
  ReviewStats,
  SaveWordRequest,
  Word,
  WordPhase,
} from '../types'

export function wordToReviewItem(row: Word): ReviewItem {
  return {
    word_id: row.id,
    word: row.word,
    sentence: row.sentence,
    explanation: row.explanation,
    translation: row.translation,
    phase: row.phase,
  }
}

export async function createWord(input: SaveWordRequest): Promise<Word> {
  const now = Date.now()
  const fsrs_card = initWordFsrsCard(new Date(now))
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
    phase: DEFAULT_NEW_WORD_PHASE,
    learning_step: 0,
    next_review_at: fsrs_card.due,
    scheduler: 'fsrs',
    fsrs_card,
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

function phaseOf(word: Word): WordPhase {
  return word.phase ?? 'review'
}

export async function getNextDueReview(): Promise<ReviewItem | null> {
  const now = Date.now()
  const due = await otterDb.words
    .where('next_review_at')
    .belowOrEqual(now)
    .toArray()

  if (due.length === 0) {
    return null
  }

  due.sort((a, b) => {
    const pa = PHASE_QUEUE_PRIORITY[phaseOf(a)]
    const pb = PHASE_QUEUE_PRIORITY[phaseOf(b)]
    if (pa !== pb) {
      return pa - pb
    }
    return (a.next_review_at ?? 0) - (b.next_review_at ?? 0)
  })

  return wordToReviewItem(due[0]!)
}

export async function submitReviewAnswer(
  payload: ReviewAnswer,
): Promise<Word> {
  const row = await otterDb.words.get(payload.word_id)
  if (!row) {
    throw new Error('词条不存在')
  }
  const now = Date.now()
  const updated = applyReviewRating(row, payload.rating, now)
  await otterDb.words.put(updated)
  return updated
}

export async function getWordById(id: string): Promise<Word | undefined> {
  return otterDb.words.get(id)
}

export async function getReviewStats(): Promise<ReviewStats> {
  const now = Date.now()
  const all = await otterDb.words.toArray()
  let due = 0
  let learning = 0
  let relearning = 0
  let reviewDue = 0

  for (const w of all) {
    const p = phaseOf(w)
    if (p === 'learning') {
      learning += 1
    } else if (p === 'relearning') {
      relearning += 1
    }
    const isDue = (w.next_review_at ?? 0) <= now
    if (isDue) {
      due += 1
      if (p === 'review') {
        reviewDue += 1
      }
    }
  }

  return {
    due,
    learning,
    relearning,
    reviewDue,
    totalWords: all.length,
  }
}

export async function previewReviewById(
  wordId: string,
): Promise<ReviewOutcomePreview[]> {
  const row = await otterDb.words.get(wordId)
  if (!row) {
    throw new Error('词条不存在')
  }
  return previewReviewOutcomes(row)
}
