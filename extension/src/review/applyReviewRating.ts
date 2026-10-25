import type { ReviewRating, Word, WordPhase } from '../types'
import { applyFsrsRating } from './fsrsCardBridge'

export const PHASE_QUEUE_PRIORITY: Record<WordPhase, number> = {
  learning: 0,
  relearning: 1,
  review: 2,
}

/** Apply a review rating via FSRS (ts-fsrs). */
export function applyReviewRating(
  word: Word,
  rating: ReviewRating,
  now: number,
): Word {
  return applyFsrsRating(word, rating, now)
}
