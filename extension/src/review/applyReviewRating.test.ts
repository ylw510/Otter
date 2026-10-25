import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { applyReviewRating } from './applyReviewRating'
import { parseStepToMs } from './learningSteps'

function baseWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'w1',
    word: 'test',
    created_at: 0,
    review_count: 0,
    ease_factor: 2.5,
    interval: 1,
    ...overrides,
  }
}

describe('applyReviewRating', () => {
  it('graduates learning card after final good step', () => {
    const now = 1_000_000
    const word = baseWord({
      phase: 'learning',
      learning_step: 2,
      next_review_at: now,
    })
    const next = applyReviewRating(word, 'good', now)
    expect(next.phase).toBe('review')
    expect(next.next_review_at).toBe(now + 86_400_000)
  })

  it('resets learning step on again', () => {
    const now = 2_000_000
    const word = baseWord({
      phase: 'learning',
      learning_step: 2,
      next_review_at: now,
    })
    const next = applyReviewRating(word, 'again', now)
    expect(next.phase).toBe('learning')
    expect(next.learning_step).toBe(0)
    expect(next.next_review_at).toBe(now + parseStepToMs('1m'))
  })

  it('sends mature again into relearning', () => {
    const now = 3_000_000
    const word = baseWord({
      phase: 'review',
      review_count: 3,
      next_review_at: now,
    })
    const next = applyReviewRating(word, 'again', now)
    expect(next.phase).toBe('relearning')
    expect(next.learning_step).toBe(0)
    expect(next.next_review_at).toBe(now + parseStepToMs('10m'))
  })
})
