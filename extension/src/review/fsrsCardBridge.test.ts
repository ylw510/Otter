import { describe, expect, it } from 'vitest'
import { initWordFsrsCard, stateToPhase } from './fsrsCardBridge'
import { State } from 'ts-fsrs'

describe('fsrsCardBridge', () => {
  it('maps FSRS states to Otter phases', () => {
    expect(stateToPhase(State.Learning)).toBe('learning')
    expect(stateToPhase(State.Review)).toBe('review')
    expect(stateToPhase(State.Relearning)).toBe('relearning')
  })

  it('creates due snapshot for new words', () => {
    const snap = initWordFsrsCard(new Date(1000))
    expect(snap.due).toBeGreaterThanOrEqual(1000)
  })
})
