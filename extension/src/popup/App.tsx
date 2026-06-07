import { useEffect, useRef, useState } from 'react'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'
import { Test } from './pages/Test'
import { WordList } from './pages/WordList'
import { openLocalPdfFile, openPdfViewerHome } from '../utils/openPdf'

type Page = 'list' | 'review' | 'settings' | 'test'

const navBtn =
  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-2 focus-visible:ring-offset-otter-canvas'

export function App() {
  const [page, setPage] = useState<Page>('list')
  const pdfInputRef = useRef<HTMLInputElement>(null)

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
    <div className="min-h-[280px] bg-otter-canvas text-otter-ink">
      <header className="border-b border-otter-border bg-otter-surface/80 px-4 py-3 shadow-otter-sm backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-otter-ink">
              Otter
            </h1>
            <p className="mt-0.5 text-xs text-otter-muted">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void openLocalPdfFile(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs font-medium text-otter-muted ring-1 ring-otter-border transition-colors hover:bg-otter-surface-raised hover:text-otter-ink"
              title="在 Otter PDF 查看器中打开"
              onClick={() => pdfInputRef.current?.click()}
            >
              PDF
            </button>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs font-medium text-otter-muted transition-colors hover:text-otter-ink"
              title="打开 PDF 查看器"
              onClick={() => void openPdfViewerHome()}
            >
              ↗
            </button>
          </div>
        </div>
        <nav
          className="mt-3 flex flex-wrap gap-1"
          aria-label="主导航"
        >
          {(
            [
              ['list', '词汇'],
              ['review', '复习'],
              ['settings', '设置'],
              ['test', '测试'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${navBtn} ${
                page === id
                  ? 'bg-otter-surface-raised text-otter-ink shadow-otter-sm ring-1 ring-otter-border'
                  : 'text-otter-muted hover:bg-otter-surface-raised hover:text-otter-ink'
              }`}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
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
