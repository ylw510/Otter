import Dexie, { type EntityTable } from 'dexie'
import type { Word } from '../types'

export class OtterDatabase extends Dexie {
  words!: EntityTable<Word, 'id'>

  constructor() {
    super('otter')
    this.version(1).stores({
      words: 'id, created_at, next_review_at, word',
    })
  }
}

export const otterDb = new OtterDatabase()
