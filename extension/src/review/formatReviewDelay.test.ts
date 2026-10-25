import { describe, expect, it } from 'vitest'
import { formatReviewDelayMs } from './formatReviewDelay'

describe('formatReviewDelayMs', () => {
  it('formats days and minutes', () => {
    expect(formatReviewDelayMs(86_400_000)).toBe('1 天')
    expect(formatReviewDelayMs(600_000)).toBe('10 分钟')
  })
})
