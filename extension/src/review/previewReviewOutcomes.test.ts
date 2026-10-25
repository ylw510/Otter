import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { previewReviewOutcomes } from './previewReviewOutcomes'

describe('previewReviewOutcomes', () => {
  it('returns four outcomes for a learning card', () => {
    const word: Word = {
      id: '1',
      word: 'x',
      created_at: 0,
      review_count: 0,
      ease_factor: 2.5,
      phase: 'learning',
      learning_step: 0,
      next_review_at: 1000,
    }
    const now = 1000
    const previews = previewReviewOutcomes(word, now)
    expect(previews).toHaveLength(4)
    expect(previews.every((p) => p.label.length > 0)).toBe(true)
  })
})
