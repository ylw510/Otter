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
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        加载复习…
      </div>
    )
  }

  if (err) {
    return (
      <div className="flex flex-col gap-3 px-4 py-6">
        <p className="text-sm text-red-400">{err}</p>
        <button
          type="button"
          className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
          onClick={() => void loadNext()}
        >
          重试
        </button>
      </div>
    )
  }

  if (item === null) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-zinc-400">目前没有到期的复习项。</p>
        <p className="mt-2 text-xs text-zinc-600">
          保存新词或等待下次复习时间。
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
          onClick={() => void loadNext()}
        >
          刷新
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-lg">
        <div className="text-lg font-semibold leading-snug text-white">
          {item.word}
        </div>
        {item.sentence ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {item.sentence}
          </p>
        ) : null}
        {item.explanation ? (
          <p className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-500">
            {item.explanation}
          </p>
        ) : null}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500">
          记忆程度（0–5）
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([0, 1, 2, 3, 4, 5] as const).map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-left text-xs text-zinc-200 transition hover:border-indigo-500 hover:bg-zinc-900 disabled:opacity-50"
              onClick={() => void submit(q)}
            >
              <span className="font-mono text-indigo-400">{q}</span>{' '}
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
