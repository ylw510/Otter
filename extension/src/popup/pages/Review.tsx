import { useCallback, useEffect, useState } from 'react'
import type {
  Message,
  ReviewAnswer,
  ReviewItem,
  ReviewRating,
  WordPhase,
} from '../../types'
import { raceSendMessage } from '../../utils/messaging'
import { wordMeaning } from '../../utils/wordMeaning'
import {
  REVIEW_RATING_LABELS,
  REVIEW_RATINGS,
} from '../../review/rating'

const btnPrimary =
  'rounded-lg bg-otter-accent px-3 py-2 text-sm font-medium text-white shadow-otter-sm transition-colors hover:bg-otter-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-2 focus-visible:ring-offset-otter-canvas disabled:opacity-50'

const ratingBtnBase =
  'rounded-lg border px-2 py-2.5 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring disabled:opacity-50'

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

export function Review() {
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<ReviewItem | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadNext = useCallback(async (opts?: { silent?: boolean }) => {
    setErr(null)
    setRevealed(false)
    if (!opts?.silent) setLoading(true)
    try {
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
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadNext()
    })
  }, [loadNext])

  const submit = async (rating: ReviewRating) => {
    if (!item || !revealed) return
    setBusy(true)
    setErr(null)
    try {
      const payload: ReviewAnswer = { word_id: item.word_id, rating }
      const msg: Message<ReviewAnswer> = {
        type: 'SUBMIT_REVIEW',
        payload,
      }
      const res = (await raceSendMessage(msg)) as {
        error?: string
      }
      if (res?.error) {
        setErr(res.error)
        return
      }
      await loadNext({ silent: true })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-sm text-otter-muted">
        加载复习…
      </div>
    )
  }

  if (err) {
    return (
      <div className="flex flex-col gap-3 px-4 py-6">
        <p className="rounded-lg border border-red-200 bg-otter-danger-bg px-3 py-2 text-sm text-otter-danger">
          {err}
        </p>
        <button type="button" className={btnPrimary} onClick={() => void loadNext()}>
          重试
        </button>
      </div>
    )
  }

  if (item === null) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-otter-muted">目前没有到期的复习项。</p>
        <p className="mt-2 text-xs text-otter-subtle">
          保存新词或等待下次复习时间。
        </p>
        <button
          type="button"
          className={`mt-4 ${btnPrimary}`}
          onClick={() => void loadNext()}
        >
          刷新
        </button>
      </div>
    )
  }

  const meaning = wordMeaning(item)
  const phaseLabel = reviewPhaseLabel(item.phase)

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="rounded-xl border border-otter-border bg-otter-surface p-4 shadow-otter-card">
        <p className="text-[11px] font-medium uppercase tracking-wide text-otter-subtle">
          {phaseLabel}
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
            {meaning ? (
              <p className="text-sm leading-relaxed text-otter-ink">{meaning}</p>
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
            {REVIEW_RATINGS.map((rating) => {
              const { title, hint } = REVIEW_RATING_LABELS[rating]
              return (
                <button
                  key={rating}
                  type="button"
                  disabled={busy}
                  className={`${ratingBtnBase} ${ratingStyles[rating]}`}
                  onClick={() => void submit(rating)}
                >
                  <span className="font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[11px] opacity-80">
                    {hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
