import {
  createEmptyCard,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs'
import type { FsrsCardSnapshot, ReviewRating, Word, WordPhase } from '../types'
import { getOtterFsrs } from './fsrsScheduler'
import { ratingToFsrsGrade } from './rating'

export function stateToPhase(state: State): WordPhase {
  switch (state) {
    case State.New:
    case State.Learning:
      return 'learning'
    case State.Relearning:
      return 'relearning'
    default:
      return 'review'
  }
}

export function cardToSnapshot(card: Card): FsrsCardSnapshot {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.getTime(),
  }
}

export function snapshotToCard(snapshot: FsrsCardSnapshot): Card {
  return {
    due: new Date(snapshot.due),
    stability: snapshot.stability,
    difficulty: snapshot.difficulty,
    elapsed_days: 0,
    scheduled_days: snapshot.scheduled_days,
    learning_steps: snapshot.learning_steps,
    reps: snapshot.reps,
    lapses: snapshot.lapses,
    state: snapshot.state,
    last_review: snapshot.last_review
      ? new Date(snapshot.last_review)
      : undefined,
  }
}

/** Build FSRS card from stored snapshot or legacy SM-2 / phase fields. */
export function ensureFsrsCard(word: Word, now: Date): Card {
  if (word.fsrs_card) {
    return snapshotToCard(word.fsrs_card)
  }

  const due = new Date(word.next_review_at ?? now.getTime())
  let card = createEmptyCard(now)

  if (word.phase === 'review' && (word.review_count ?? 0) > 0) {
    card = {
      ...card,
      state: State.Review,
      due,
      stability: Math.max(S_MIN_FALLBACK, word.interval ?? 1),
      difficulty: 5,
      scheduled_days: word.interval ?? 1,
      reps: word.review_count,
      lapses: 0,
    }
  } else if (word.phase === 'relearning') {
    card = {
      ...card,
      state: State.Relearning,
      due,
      learning_steps: word.learning_step ?? 0,
    }
  } else {
    card = {
      ...card,
      state: State.Learning,
      due,
      learning_steps: word.learning_step ?? 0,
    }
  }

  return card
}

const S_MIN_FALLBACK = 0.4

export function initWordFsrsCard(now = new Date()): FsrsCardSnapshot {
  return cardToSnapshot(createEmptyCard(now))
}

export function mergeCardIntoWord(word: Word, card: Card): Word {
  const snapshot = cardToSnapshot(card)
  return {
    ...word,
    fsrs_card: snapshot,
    scheduler: 'fsrs',
    next_review_at: snapshot.due,
    phase: stateToPhase(card.state),
    learning_step: card.learning_steps,
    review_count: card.reps,
    lapses: card.lapses,
    last_review_at: snapshot.last_review,
    interval: Math.max(1, Math.round(card.scheduled_days)),
  }
}

export function applyFsrsRating(
  word: Word,
  rating: ReviewRating,
  nowMs: number,
): Word {
  const now = new Date(nowMs)
  const scheduler = getOtterFsrs()
  const card = ensureFsrsCard(word, now)
  const grade: Grade = ratingToFsrsGrade(rating)
  const result = scheduler.next(card, now, grade)
  return mergeCardIntoWord(word, result.card)
}

export function previewFsrsOutcomes(word: Word, nowMs: number) {
  const now = new Date(nowMs)
  const scheduler = getOtterFsrs()
  const card = ensureFsrsCard(word, now)
  return scheduler.repeat(card, now)
}
