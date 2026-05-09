import { useCallback, useEffect, useState } from 'react'
import type { Message, ReviewAnswer, ReviewItem } from '../../types'
import { raceSendMessage } from '../../utils/messaging'

const QUALITY_LABELS: Record<number, string> = {
  0: '完全不记得',
  1: '很难想起',
  2: '吃力',
  3: '勉强',
  4: '顺利',
  5: '很轻松',
}

const btnPrimary =
  'rounded-lg bg-otter-accent px-3 py-2 text-sm font-medium text-white shadow-otter-sm transition-colors hover:bg-otter-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-2 focus-visible:ring-offset-otter-canvas'

const btnGhost =
  'rounded-lg border border-otter-border bg-otter-surface-raised px-2 py-2 text-left text-xs text-otter-ink transition-colors hover:border-otter-border-strong hover:bg-otter-surface disabled:opacity-50'

export function Review() {
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<ReviewItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadNext = useCallback(async (opts?: { silent?: boolean }) => {
    setErr(null)
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

  const submit = async (quality: ReviewAnswer['quality']) => {
    if (!item) return
    setBusy(true)
    setErr(null)
    try {
      const payload: ReviewAnswer = { word_id: item.word_id, quality }
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

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="rounded-xl border border-otter-border bg-otter-surface p-4 shadow-otter-card">
        <div className="text-lg font-semibold leading-snug text-otter-ink">
          {item.word}
        </div>
        {item.sentence ? (
          <p className="mt-3 text-sm leading-relaxed text-otter-muted">
            {item.sentence}
          </p>
        ) : null}
        {item.explanation ? (
          <p className="mt-3 border-t border-otter-border pt-3 text-sm text-otter-subtle">
            {item.explanation}
          </p>
        ) : null}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-otter-subtle">
          记忆程度（0–5）
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([0, 1, 2, 3, 4, 5] as const).map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              className={`${btnGhost} focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring`}
              onClick={() => void submit(q)}
            >
              <span className="font-mono font-semibold text-otter-accent">
                {q}
              </span>{' '}
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
