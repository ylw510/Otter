import type { ReviewOutcomePreview, Word } from '../types'
import { formatReviewDelayMs } from './formatReviewDelay'
import { previewFsrsOutcomes } from './fsrsCardBridge'
import { ratingToFsrsGrade, REVIEW_RATINGS } from './rating'

export function previewReviewOutcomes(
  word: Word,
  now = Date.now(),
): ReviewOutcomePreview[] {
  const preview = previewFsrsOutcomes(word, now)
  return REVIEW_RATINGS.map((rating) => {
    const grade = ratingToFsrsGrade(rating)
    const item = preview[grade]
    const at = item.card.due.getTime()
    return {
      rating,
      nextReviewAt: at,
      label: formatReviewDelayMs(at - now),
    }
  })
}
