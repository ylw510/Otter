import { speakText } from '../../utils/speakText'

const btn =
  'inline-flex shrink-0 items-center justify-center rounded-md border border-otter-border bg-otter-surface-raised p-1 text-otter-muted transition-colors hover:border-otter-border-strong hover:text-otter-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-1 focus-visible:ring-offset-otter-surface'

type Props = {
  text: string
  className?: string
  /** BCP 47 language tag for pronunciation (default English). */
  lang?: string
}

export function SpeakButton({ text, className = '', lang }: Props) {
  const label = `朗读「${text}」`

  return (
    <button
      type="button"
      className={`${btn} ${className}`.trim()}
      aria-label={label}
      title="朗读"
      onClick={() => speakText(text, lang)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18 6a9 9 0 0 1 0 12" />
      </svg>
    </button>
  )
}
