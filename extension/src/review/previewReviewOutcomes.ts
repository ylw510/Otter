import type { ReviewOutcomePreview, Word } from '../types'
import { applyReviewRating } from './applyReviewRating'
import { formatReviewDelayMs } from './formatReviewDelay'
import { REVIEW_RATINGS } from './rating'

export function previewReviewOutcomes(
  word: Word,
  now = Date.now(),
): ReviewOutcomePreview[] {
  return REVIEW_RATINGS.map((rating) => {
    const next = applyReviewRating(word, rating, now)
    const at = next.next_review_at ?? now
    return {
      rating,
      nextReviewAt: at,
      label: formatReviewDelayMs(at - now),
    }
  })
}
