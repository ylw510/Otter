import { useEffect, useState } from 'react'
import type { Word } from '../../types'
import { WORDS_STORAGE_KEY } from '../../types'
import { getWords } from '../../utils/storage'
import { WordCard } from '../components/WordCard'

export function WordList() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

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

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      if (!changes[WORDS_STORAGE_KEY]) return
      const next = changes[WORDS_STORAGE_KEY].newValue as Word[] | undefined
      setWords(next ?? [])
    }

    chrome.storage.onChanged.addListener(listener)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-zinc-500">加载中…</div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        在网页上选中单词，点击{' '}
        <span className="text-zinc-300">💾 Save</span> 即可加入列表。
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
