/**
 * SM-2 interval scheduling (aligned with server/app/services/review_service.py).
 * quality: 0–5. Returns [intervalDays, easeFactor, reviewCount].
 */
export function calculateNextReview(
  quality: number,
  easeFactor: number,
  interval: number,
  reviewCount: number,
): [number, number, number] {
  if (quality < 3) {
    return [1, Math.max(1.3, easeFactor - 0.2), reviewCount + 1]
  }

  let newInterval: number
  if (reviewCount === 0) {
    newInterval = 1
  } else if (reviewCount === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * easeFactor)
  }

  let newEase =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEase = Math.max(1.3, newEase)

  return [newInterval, newEase, reviewCount + 1]
}
