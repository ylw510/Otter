import { describe, expect, it } from 'vitest'
import { ratingToQuality } from './rating'

describe('ratingToQuality', () => {
  it('maps four review buttons to SM-2 quality', () => {
    expect(ratingToQuality('again')).toBe(1)
    expect(ratingToQuality('hard')).toBe(3)
    expect(ratingToQuality('good')).toBe(4)
    expect(ratingToQuality('easy')).toBe(5)
  })
})
