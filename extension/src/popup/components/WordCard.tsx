import type { Word } from '../../types'
import { appendReturnHighlightUrl } from '../../utils/appendReturnHighlightUrl'

type Props = { word: Word }

export function WordCard({ word }: Props) {
  const date = new Date(word.created_at).toLocaleString()

  return (
    <article className="rounded-xl border border-otter-border bg-otter-surface px-3 py-2.5 shadow-otter-sm transition-shadow duration-150 hover:shadow-otter-card">
      <div className="font-semibold text-otter-ink">{word.word}</div>
      {word.sentence ? (
        <p className="mt-1 text-xs leading-relaxed text-otter-muted">
          {word.sentence}
        </p>
      ) : null}
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
