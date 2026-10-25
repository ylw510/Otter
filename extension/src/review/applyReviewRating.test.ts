import { State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { applyReviewRating } from './applyReviewRating'
import { initWordFsrsCard, snapshotToCard } from './fsrsCardBridge'

function baseWord(overrides: Partial<Word> = {}): Word {
  const now = Date.now()
  return {
    id: 'w1',
    word: 'test',
    created_at: now,
    review_count: 0,
    ease_factor: 2.5,
    interval: 1,
    scheduler: 'fsrs',
    fsrs_card: initWordFsrsCard(new Date(now)),
    phase: 'learning',
    next_review_at: now,
    ...overrides,
  }
}

describe('applyReviewRating (FSRS)', () => {
  it('schedules a future review after Good on a new card', () => {
    const now = 1_000_000
    const word = baseWord({ next_review_at: now })
    const next = applyReviewRating(word, 'good', now)
    expect(next.fsrs_card).toBeDefined()
    expect(next.next_review_at).toBeGreaterThan(now)
  })

  it('moves legacy mature card to relearning on Again', () => {
    const now = 3_000_000
    const card = snapshotToCard(initWordFsrsCard(new Date(now)))
    card.state = State.Review
    card.reps = 5
    card.stability = 10
    card.scheduled_days = 10
    const word = baseWord({
      phase: 'review',
      review_count: 5,
      fsrs_card: undefined,
      next_review_at: now,
    })
    const next = applyReviewRating(word, 'again', now)
    expect(next.phase).toBe('relearning')
    expect(next.next_review_at).toBeGreaterThan(now)
  })
})
