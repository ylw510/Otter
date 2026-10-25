import { Rating, type Grade } from 'ts-fsrs'
import type { ReviewRating } from '../types'

export function ratingToFsrsGrade(rating: ReviewRating): Grade {
  switch (rating) {
    case 'again':
      return Rating.Again
    case 'hard':
      return Rating.Hard
    case 'good':
      return Rating.Good
    case 'easy':
      return Rating.Easy
  }
}

/** Map Anki-style four buttons to SM-2 quality (0–5). */
export function ratingToQuality(rating: ReviewRating): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (rating) {
    case 'again':
      return 1
    case 'hard':
      return 3
    case 'good':
      return 4
    case 'easy':
      return 5
  }
}

export const REVIEW_RATING_LABELS: Record<
  ReviewRating,
  { title: string; hint: string }
> = {
  again: { title: 'Again', hint: '完全不记得' },
  hard: { title: 'Hard', hint: '很难想起' },
  good: { title: 'Good', hint: '顺利想起' },
  easy: { title: 'Easy', hint: '非常轻松' },
}

export const REVIEW_RATINGS: ReviewRating[] = [
  'again',
  'hard',
  'good',
  'easy',
]
