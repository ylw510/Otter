/** Human-readable delay until next review (Chinese, compact for popup). */
export function formatReviewDelayMs(delayMs: number): string {
  const ms = Math.max(0, delayMs)
  if (ms < 60_000) {
    return '<1 分钟'
  }
  if (ms < 3_600_000) {
    const m = Math.round(ms / 60_000)
    return `${m} 分钟`
  }
  if (ms < 86_400_000) {
    const h = Math.round(ms / 3_600_000)
    return `${h} 小时`
  }
  const d = Math.round(ms / 86_400_000)
  return `${d} 天`
}
