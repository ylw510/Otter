import { describe, expect, it } from 'vitest'
import { parseStepToMs, stepDelayMs } from './learningSteps'

describe('learningSteps', () => {
  it('parses minute hour day steps', () => {
    expect(parseStepToMs('1m')).toBe(60_000)
    expect(parseStepToMs('1h')).toBe(3_600_000)
    expect(parseStepToMs('1d')).toBe(86_400_000)
  })

  it('clamps step index to available steps', () => {
    expect(stepDelayMs(['1m', '1d'], 99)).toBe(86_400_000)
  })
})
