import Dexie, { type EntityTable } from 'dexie'
import type { Word, WordPhase } from '../types'

export class OtterDatabase extends Dexie {
  words!: EntityTable<Word, 'id'>

  constructor() {
    super('otter')
    this.version(1).stores({
      words: 'id, created_at, next_review_at, word',
    })
    this.version(2)
      .stores({
        words: 'id, created_at, next_review_at, word, phase',
      })
      .upgrade(async (tx) => {
        await tx
          .table('words')
          .toCollection()
          .modify((word: Word) => {
            if (!word.phase) {
              word.phase = 'review'
            }
            if (word.learning_step === undefined) {
              word.learning_step = 0
            }
          })
      })
  }
}

export const otterDb = new OtterDatabase()

export const DEFAULT_NEW_WORD_PHASE: WordPhase = 'learning'
