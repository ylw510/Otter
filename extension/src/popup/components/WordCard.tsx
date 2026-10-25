import { useState } from 'react'
import type { Word } from '../../types'
import { appendReturnHighlightUrl } from '../../utils/appendReturnHighlightUrl'
import { updateWord } from '../../utils/storage'
import { wordMeaning } from '../../utils/wordMeaning'
import { SpeakButton } from './SpeakButton'

type Props = { word: Word }

const btnSm =
  'rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-1 focus-visible:ring-offset-otter-surface'

export function WordCard({ word }: Props) {
  const date = new Date(word.created_at).toLocaleString()
  const meaning = wordMeaning(word)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(meaning)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const openEdit = () => {
    setDraft(meaning)
    setSaveErr(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(meaning)
    setSaveErr(null)
    setEditing(false)
  }

  const save = async () => {
    setSaving(true)
    setSaveErr(null)
    try {
      await updateWord(word.id, draft)
      setEditing(false)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-xl border border-otter-border bg-otter-surface px-3 py-2.5 shadow-otter-sm transition-shadow duration-150 hover:shadow-otter-card">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 font-semibold text-otter-ink">
          {word.word}
        </div>
        <SpeakButton text={word.word} />
      </div>
      {word.sentence ? (
        <p className="mt-1 text-xs leading-relaxed text-otter-muted">
          {word.sentence}
        </p>
      ) : null}

      <div className="mt-2 border-t border-otter-border pt-2">
        {editing ? (
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-otter-subtle">
              释义
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="输入中文释义或简短说明…"
              className="w-full resize-y rounded-lg border border-otter-border bg-otter-surface-raised px-2 py-1.5 text-xs leading-relaxed text-otter-ink placeholder:text-otter-subtle focus:border-otter-accent focus:outline-none focus:ring-1 focus:ring-otter-ring"
              disabled={saving}
            />
            {saveErr ? (
              <p className="text-[11px] text-otter-danger">{saveErr}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${btnSm} bg-otter-accent text-white hover:bg-otter-accent-hover disabled:opacity-50`}
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                className={`${btnSm} border border-otter-border bg-otter-surface-raised text-otter-muted hover:bg-otter-surface disabled:opacity-50`}
                onClick={cancelEdit}
                disabled={saving}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            {meaning ? (
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-otter-ink">
                <span className="font-medium text-otter-subtle">释义 · </span>
                {meaning}
              </p>
            ) : (
              <p className="flex-1 text-xs italic text-otter-subtle">暂无释义</p>
            )}
            <button
              type="button"
              className={`${btnSm} shrink-0 border border-otter-border bg-otter-surface-raised text-otter-accent hover:border-otter-border-strong hover:text-otter-accent-hover`}
              onClick={openEdit}
            >
              {meaning ? '编辑' : '添加释义'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-otter-subtle">
        {word.source_site ? (
          <span className="rounded-md border border-otter-border bg-otter-surface-raised px-1.5 py-0.5 font-medium text-otter-muted">
            {word.source_site}
          </span>
        ) : null}
        <span>{date}</span>
      </div>
      {word.source_url ? (
        <a
          href={appendReturnHighlightUrl(word.source_url, word.word)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block max-w-full truncate text-[11px] font-medium text-otter-accent underline-offset-2 hover:text-otter-accent-hover hover:underline"
        >
          {word.source_title || word.source_url}
        </a>
      ) : null}
    </article>
  )
}
