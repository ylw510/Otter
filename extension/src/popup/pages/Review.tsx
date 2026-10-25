import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  Message,
  PreviewReviewRequest,
  ReviewAnswer,
  ReviewItem,
  ReviewOutcomePreview,
  ReviewRating,
  ReviewStats,
  WordPhase,
} from '../../types'
import {
  REVIEW_RATING_LABELS,
  REVIEW_RATINGS,
} from '../../review/rating'
import { REVIEW_SESSION_LIMIT } from '../../review/sessionConstants'
import { raceSendMessage } from '../../utils/messaging'
import { wordMeaning } from '../../utils/wordMeaning'

const btnPrimary =
  'rounded-lg bg-otter-accent px-3 py-2 text-sm font-medium text-white shadow-otter-sm transition-colors hover:bg-otter-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-2 focus-visible:ring-offset-otter-canvas disabled:opacity-50'

const ratingBtnBase =
  'rounded-lg border px-2 py-2.5 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring disabled:opacity-50'

const KEY_TO_RATING: Record<string, ReviewRating> = {
  '1': 'again',
  '2': 'hard',
  '3': 'good',
  '4': 'easy',
}

function reviewPhaseLabel(phase: WordPhase | undefined): string {
  switch (phase ?? 'review') {
    case 'learning':
      return '新词 · 学习中'
    case 'relearning':
      return '重新学习'
    default:
      return '复习'
  }
}

const ratingStyles: Record<ReviewRating, string> = {
  again:
    'border-red-200 bg-otter-danger-bg text-otter-danger hover:border-red-300',
  hard: 'border-otter-border bg-otter-surface-raised text-otter-ink hover:border-otter-border-strong',
  good: 'border-otter-accent/30 bg-otter-surface text-otter-ink hover:border-otter-accent/50',
  easy: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300',
}

function ReviewStatsBar({ stats }: { stats: ReviewStats }) {
  return (
    <p className="border-b border-otter-border px-4 py-2 text-[11px] text-otter-muted">
      到期{' '}
      <span className="font-semibold text-otter-ink">{stats.due}</span>
      <span className="mx-1.5 text-otter-border">·</span>
      学习{' '}
      <span className="font-semibold text-otter-ink">{stats.learning}</span>
      <span className="mx-1.5 text-otter-border">·</span>
      重学{' '}
      <span className="font-semibold text-otter-ink">{stats.relearning}</span>
      <span className="mx-1.5 text-otter-border">·</span>
      复习到期{' '}
      <span className="font-semibold text-otter-ink">{stats.reviewDue}</span>
    </p>
  )
}

export function Review() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [item, setItem] = useState<ReviewItem | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [previews, setPreviews] = useState<ReviewOutcomePreview[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sessionTarget, setSessionTarget] = useState<number | null>(null)
  const [sessionDone, setSessionDone] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const sessionInitialized = useRef(false)

  const fetchStats = useCallback(async () => {
    const msg: Message = { type: 'GET_REVIEW_STATS', payload: {} }
    const data = (await raceSendMessage(msg)) as ReviewStats & { error?: string }
    if (data?.error) {
      throw new Error(data.error)
    }
    const nextStats: ReviewStats = {
      due: data.due ?? 0,
      learning: data.learning ?? 0,
      relearning: data.relearning ?? 0,
      reviewDue: data.reviewDue ?? 0,
      totalWords: data.totalWords ?? 0,
    }
    setStats(nextStats)
    if (!sessionInitialized.current && nextStats.due > 0) {
      sessionInitialized.current = true
      setSessionTarget(Math.min(nextStats.due, REVIEW_SESSION_LIMIT))
    }
    return nextStats
  }, [])

  const loadNext = useCallback(async (opts?: { silent?: boolean }) => {
    setErr(null)
    setRevealed(false)
    setPreviews([])
    if (!opts?.silent) setLoading(true)
    try {
      await fetchStats()
      const msg: Message = { type: 'GET_REVIEW_NEXT', payload: {} }
      const data = (await raceSendMessage(msg)) as {
        item?: ReviewItem | null
        error?: string
      }
      if (data?.error) {
        setErr(data.error)
        setItem(null)
        return
      }
      setItem(data?.item ?? null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setItem(null)
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [fetchStats])

  const startSession = useCallback(async () => {
    sessionInitialized.current = false
    setSessionComplete(false)
    setSessionDone(0)
    setSessionTarget(null)
    await loadNext()
  }, [loadNext])

  useEffect(() => {
    queueMicrotask(() => {
      void startSession()
    })
  }, [startSession])

  useEffect(() => {
    if (!item || !revealed) {
      return
    }
    let cancelled = false
    const payload: PreviewReviewRequest = { word_id: item.word_id }
    const msg: Message<PreviewReviewRequest> = {
      type: 'PREVIEW_REVIEW',
      payload,
    }
    void raceSendMessage(msg)
      .then((data) => {
        if (cancelled) return
        const outcomes = (data as { outcomes?: ReviewOutcomePreview[] })
          .outcomes
        setPreviews(outcomes ?? [])
      })
      .catch(() => {
        if (!cancelled) setPreviews([])
      })
    return () => {
      cancelled = true
    }
  }, [item, revealed])

  const previewLabel = (rating: ReviewRating): string | undefined =>
    previews.find((p) => p.rating === rating)?.label

  const submit = useCallback(
    async (rating: ReviewRating) => {
      if (!item || !revealed || busy) return
      setBusy(true)
      setErr(null)
      try {
        const payload: ReviewAnswer = { word_id: item.word_id, rating }
        const msg: Message<ReviewAnswer> = {
          type: 'SUBMIT_REVIEW',
          payload,
        }
        const res = (await raceSendMessage(msg)) as { error?: string }
        if (res?.error) {
          setErr(res.error)
          return
        }
        const nextDone = sessionDone + 1
        setSessionDone(nextDone)
        const target = sessionTarget ?? REVIEW_SESSION_LIMIT
        if (nextDone >= target) {
          setSessionComplete(true)
          setItem(null)
          await fetchStats()
          return
        }
        await loadNext({ silent: true })
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [
      item,
      revealed,
      busy,
      sessionDone,
      sessionTarget,
      fetchStats,
      loadNext,
    ],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (item && !revealed && !busy) {
          setRevealed(true)
        }
        return
      }
      const rating = KEY_TO_RATING[e.key]
      if (rating && item && revealed && !busy) {
        e.preventDefault()
        void submit(rating)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, revealed, busy, submit])

  if (loading && !stats) {
    return (
      <div className="px-4 py-10 text-center text-sm text-otter-muted">
        加载复习…
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {stats ? <ReviewStatsBar stats={stats} /> : null}

      {sessionTarget !== null && sessionTarget > 0 && !sessionComplete ? (
        <p className="px-4 py-1.5 text-center text-[11px] text-otter-subtle">
          本次进度{' '}
          <span className="font-semibold text-otter-ink">
            {sessionDone}/{sessionTarget}
          </span>
          <span className="ml-2 text-otter-subtle">Space 显示答案 · 1–4 评分</span>
        </p>
      ) : null}

      {err ? (
        <div className="flex flex-col gap-3 px-4 py-6">
          <p className="rounded-lg border border-red-200 bg-otter-danger-bg px-3 py-2 text-sm text-otter-danger">
            {err}
          </p>
          <button type="button" className={btnPrimary} onClick={() => void startSession()}>
            重试
          </button>
        </div>
      ) : null}

      {!err && sessionComplete ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium text-otter-ink">本次复习已完成</p>
          <p className="mt-2 text-xs text-otter-muted">
            已完成 {sessionDone} 张卡片
          </p>
          <button
            type="button"
            className={`mt-4 ${btnPrimary}`}
            onClick={() => void startSession()}
          >
            继续复习
          </button>
        </div>
      ) : null}

      {!err && !sessionComplete && item === null && !loading ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-otter-muted">目前没有到期的复习项。</p>
          <button
            type="button"
            className={`mt-4 ${btnPrimary}`}
            onClick={() => void startSession()}
          >
            刷新
          </button>
        </div>
      ) : null}

      {!err && !sessionComplete && item !== null ? (
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="rounded-xl border border-otter-border bg-otter-surface p-4 shadow-otter-card">
            <p className="text-[11px] font-medium uppercase tracking-wide text-otter-subtle">
              {reviewPhaseLabel(item.phase)}
              <span className="mx-1.5 text-otter-border">·</span>
              {revealed ? '答案' : '回忆这个词的意思'}
            </p>
            <div className="mt-2 text-lg font-semibold leading-snug text-otter-ink">
              {item.word}
            </div>
            {item.sentence ? (
              <p className="mt-3 text-sm leading-relaxed text-otter-muted">
                {item.sentence}
              </p>
            ) : null}
            {revealed ? (
              <div className="mt-3 border-t border-otter-border pt-3">
                {wordMeaning(item) ? (
                  <p className="text-sm leading-relaxed text-otter-ink">
                    {wordMeaning(item)}
                  </p>
                ) : (
                  <p className="text-sm italic text-otter-subtle">
                    暂无释义，可在「词汇」里添加。
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {!revealed ? (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setRevealed(true)}
            >
              显示答案
            </button>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-otter-subtle">
                你记得怎么样？
              </p>
              <div className="grid grid-cols-2 gap-2">
                {REVIEW_RATINGS.map((rating, idx) => {
                  const { title, hint } = REVIEW_RATING_LABELS[rating]
                  const interval = previewLabel(rating)
                  return (
                    <button
                      key={rating}
                      type="button"
                      disabled={busy}
                      className={`${ratingBtnBase} ${ratingStyles[rating]}`}
                      onClick={() => void submit(rating)}
                    >
                      <span className="font-semibold">
                        {idx + 1}. {title}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">
                        {hint}
                        {interval ? ` · ${interval}` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
