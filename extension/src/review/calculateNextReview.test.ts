import { describe, expect, it } from 'vitest'
import { calculateNextReview } from './calculateNextReview'

describe('calculateNextReview', () => {
  it('resets to 1 day when quality < 3', () => {
    const [days, ease, count] = calculateNextReview(2, 2.5, 10, 3)
    expect(days).toBe(1)
    expect(ease).toBeCloseTo(2.3)
    expect(count).toBe(4)
  })

  it('uses 1 then 6 day ladder for early successes', () => {
    expect(calculateNextReview(4, 2.5, 1, 0)[0]).toBe(1)
    expect(calculateNextReview(4, 2.5, 1, 1)[0]).toBe(6)
  })
})
