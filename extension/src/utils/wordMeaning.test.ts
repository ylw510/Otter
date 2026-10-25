import { describe, expect, it } from 'vitest'
import { wordMeaning } from './wordMeaning'

describe('wordMeaning', () => {
  it('prefers translation over explanation', () => {
    expect(
      wordMeaning({
        translation: '  中文释义  ',
        explanation: 'English gloss',
      }),
    ).toBe('中文释义')
  })

  it('falls back to explanation', () => {
    expect(wordMeaning({ explanation: 'to prepare for' })).toBe('to prepare for')
  })

  it('returns empty when both missing', () => {
    expect(wordMeaning({})).toBe('')
  })
})
