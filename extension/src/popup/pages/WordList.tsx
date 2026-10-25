import { useCallback, useEffect, useState } from 'react'
import type { Word } from '../../types'
import { getWords } from '../../utils/storage'
import { WordCard } from '../components/WordCard'

export function WordList() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const list = await getWords()
    setWords(list)
  }, [])

  useEffect(() => {
    let cancelled = false
    void getWords()
      .then((list) => {
        if (!cancelled) setWords(list)
      })
      .catch(() => {
        if (!cancelled) setWords([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const onMessage = (msg: unknown) => {
      if (
        msg &&
        typeof msg === 'object' &&
        'type' in msg &&
        (msg as { type: string }).type === 'WORDS_CHANGED'
      ) {
        void reload()
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)
    return () => {
      cancelled = true
      chrome.runtime.onMessage.removeListener(onMessage)
    }
  }, [reload])

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-otter-muted">
        加载中…
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-otter-muted">
        在网页上选中单词，点击{' '}
        <span className="font-medium text-otter-accent">💾 Save</span>{' '}
        即可加入列表。
      </div>
    )
  }

  return (
    <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto px-3 py-3">
      {words.map((w) => (
        <li key={w.id}>
          <WordCard word={w} />
        </li>
      ))}
    </ul>
  )
}
