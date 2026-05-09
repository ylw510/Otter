import { useEffect, useState } from 'react'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'
import { Test } from './pages/Test'
import { WordList } from './pages/WordList'

type Page = 'list' | 'review' | 'settings' | 'test'

export function App() {
  const [page, setPage] = useState<Page>('list')

  useEffect(() => {
    void chrome.storage.session.get('openReview').then((r) => {
      if (r.openReview) {
        setPage('review')
        void chrome.storage.session.remove('openReview')
      }
    })
  }, [])

  const subtitle =
    page === 'list'
      ? '已保存的词汇'
      : page === 'review'
        ? '间隔复习 SM-2'
        : page === 'settings'
          ? '设置'
          : '调试'

  return (
    <div className="min-h-[280px] bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">
              Otter
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>
        <nav className="mt-3 flex gap-1 text-xs">
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 ${page === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setPage('list')}
          >
            词汇
          </button>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 ${page === 'review' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setPage('review')}
          >
            复习
          </button>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 ${page === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setPage('settings')}
          >
            设置
          </button>
          <button
            type="button"
            className={`rounded-md px-2.5 py-1 ${page === 'test' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            onClick={() => setPage('test')}
          >
            测试
          </button>
        </nav>
      </header>
      {page === 'list' ? (
        <WordList />
      ) : page === 'review' ? (
        <Review />
      ) : page === 'settings' ? (
        <Settings onBack={() => setPage('list')} />
      ) : (
        <Test />
      )}
    </div>
  )
}
