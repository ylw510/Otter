import type { ReviewRating, Word, WordPhase } from '../types'
import { calculateNextReview } from './calculateNextReview'
import {
  DEFAULT_LEARNING_STEPS,
  DEFAULT_RELEARNING_STEPS,
  stepDelayMs,
} from './learningSteps'
import { ratingToQuality } from './rating'

function normalizePhase(word: Word): WordPhase {
  return word.phase ?? 'review'
}

function graduateToReview(word: Word, now: number): Word {
  return {
    ...word,
    phase: 'review',
    learning_step: 0,
    review_count: 0,
    ease_factor: 2.5,
    interval: 1,
    last_review_at: now,
    next_review_at: now + 86_400_000,
  }
}

function applyShortPhaseRating(
  word: Word,
  rating: ReviewRating,
  now: number,
  phase: 'learning' | 'relearning',
): Word {
  const steps =
    phase === 'learning' ? DEFAULT_LEARNING_STEPS : DEFAULT_RELEARNING_STEPS
  let step = word.learning_step ?? 0

  switch (rating) {
    case 'again':
      step = 0
      break
    case 'hard':
      break
    case 'good':
      step += 1
      break
    case 'easy':
      step += 2
      break
  }

  if (step >= steps.length) {
    return graduateToReview(word, now)
  }

  return {
    ...word,
    phase,
    learning_step: step,
    last_review_at: now,
    next_review_at: now + stepDelayMs(steps, step),
  }
}

function applyMatureReviewRating(
  word: Word,
  rating: ReviewRating,
  now: number,
): Word {
  if (rating === 'again') {
    return {
      ...word,
      phase: 'relearning',
      learning_step: 0,
      last_review_at: now,
      next_review_at: now + stepDelayMs(DEFAULT_RELEARNING_STEPS, 0),
    }
  }

  const interval = word.interval ?? 1
  const quality = ratingToQuality(rating)
  const [newDays, newEase, newRc] = calculateNextReview(
    quality,
    word.ease_factor,
    interval,
    word.review_count,
  )

  return {
    ...word,
    phase: 'review',
    learning_step: 0,
    review_count: newRc,
    ease_factor: newEase,
    interval: newDays,
    last_review_at: now,
    next_review_at: now + newDays * 86_400_000,
  }
}

/** Apply a review button to scheduling fields on a word row. */
export function applyReviewRating(
  word: Word,
  rating: ReviewRating,
  now: number,
): Word {
  const phase = normalizePhase(word)
  if (phase === 'learning' || phase === 'relearning') {
    return applyShortPhaseRating(word, rating, now, phase)
  }
  return applyMatureReviewRating(word, rating, now)
}

export const PHASE_QUEUE_PRIORITY: Record<WordPhase, number> = {
  learning: 0,
  relearning: 1,
  review: 2,
}
