import type { Word } from '../../types'
import { appendReturnHighlightUrl } from '../../utils/appendReturnHighlightUrl'

type Props = { word: Word }

export function WordCard({ word }: Props) {
  const date = new Date(word.created_at).toLocaleString()

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5">
      <div className="font-medium text-white">{word.word}</div>
      {word.sentence ? (
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          {word.sentence}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
        {word.source_site ? (
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
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
          className="mt-1 inline-block max-w-full truncate text-[11px] text-indigo-400 hover:underline"
        >
          {word.source_title || word.source_url}
        </a>
      ) : null}
    </article>
  )
}
