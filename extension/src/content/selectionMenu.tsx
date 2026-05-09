/* Content script entry: exports init hook + inline UI — not Fast Refresh oriented */
/* eslint-disable react-refresh/only-export-components */
import { createRoot, type Root } from 'react-dom/client'
import { useEffect, useState, type CSSProperties } from 'react'
import { APP_NAME, LOG_PREFIX, prefixedDomId } from '../brand'
import type { ExplainRequest, Message } from '../types'
import { getContextSentence, siteLabel } from '../utils/dom'
import { saveWord } from '../utils/storage'

let host: HTMLDivElement | null = null
let reactRoot: Root | null = null

/** X 等站点常在 mouseup 时清空 Range；在 selectionchange 时缓存几何，mouseup 可回落 */
let lastSelectionSnapshot: { text: string; rect: DOMRect } | null = null

function updateSelectionSnapshot() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount < 1) return
  const text = sel.toString().trim()
  if (!text) return
  const rect = sel.getRangeAt(0).getBoundingClientRect()
  lastSelectionSnapshot = { text, rect }
}

function ensureShadowMount() {
  if (host) return
  host = document.createElement('div')
  host.id = prefixedDomId('copilot-host')
  document.body.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })
  const mount = document.createElement('div')
  shadow.appendChild(mount)
  reactRoot = createRoot(mount)
}

function closeMenu() {
  reactRoot?.render(null)
}

/** document 上监听时，点 Shadow 内节点会被重定向为 host，contains(内部) 不可靠 */
function eventPathIncludesBrandHost(e: Event): boolean {
  return Boolean(host && e.composedPath().includes(host))
}

type MenuProps = {
  text: string
  top: number
  left: number
  onDone: () => void
}

function FloatingMenu({ text, top, left, onDone }: MenuProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [explainBusy, setExplainBusy] = useState(false)
  const [explainText, setExplainText] = useState<string | null>(null)

  useEffect(() => {
    return () => setToast(null)
  }, [])

  const handleSave = async () => {
    const payload = {
      word: text,
      sentence: getContextSentence(text),
      source_url: location.href,
      source_site: siteLabel(),
      source_title: document.title || undefined,
    }
    console.info(`${LOG_PREFIX}[Save] click → saveWord()`, {
      word: payload.word,
      source_site: payload.source_site,
      source_url: payload.source_url.slice(0, 120),
    })
    try {
      const result = await saveWord(payload)
      console.info(`${LOG_PREFIX}[Save] saveWord() resolved`, {
        id: result.id,
        word: result.word,
      })
      setToast('✅ Saved!')
      setIsError(false)
      setTimeout(() => {
        onDone()
      }, 650)
    } catch (e) {
      console.error(`${LOG_PREFIX}[Save] saveWord() rejected`, e)
      const tip =
        e instanceof Error && e.message
          ? `❌ ${e.message}`
          : '❌ Failed'
      setToast(tip)
      setIsError(true)
    }
  }

  const handleExplain = async () => {
    setExplainBusy(true)
    setExplainText(null)
    try {
      const payload: ExplainRequest = {
        text,
        sentence: getContextSentence(text),
      }
      const msg: Message<ExplainRequest> = {
        type: 'EXPLAIN_TEXT',
        payload,
      }
      const data = (await chrome.runtime.sendMessage(msg)) as {
        explanation?: string
        error?: string
      }
      if (data?.error) {
        setToast(`❌ ${data.error}`)
        setIsError(true)
      } else {
        setExplainText(data?.explanation ?? '')
      }
    } catch {
      setToast('❌ Explain failed')
      setIsError(true)
    } finally {
      setExplainBusy(false)
    }
  }

  const btnStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top,
          left,
          transform: 'translateX(-50%)',
          zIndex: 2147483647,
          background: '#1a1a1a',
          borderRadius: '8px',
          padding: '6px 4px',
          display: 'flex',
          gap: '4px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <button
          type="button"
          title={`${APP_NAME}：保存到词汇表（勿与浏览器自带浮条混淆）`}
          aria-label={`${APP_NAME} Save word`}
          style={btnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          onClick={() => {
            void handleSave().catch((err) => {
              console.error(`${LOG_PREFIX}[Save] unhandled rejection`, err)
            })
          }}
        >
          💾 Save
        </button>
        <button
          type="button"
          style={{
            ...btnStyle,
            opacity: explainBusy ? 0.6 : 1,
          }}
          disabled={explainBusy}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          onClick={() => void handleExplain()}
        >
          📖 Explain
        </button>
      </div>
      {explainText !== null ? (
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(420px, calc(100vw - 32px))',
            maxHeight: '220px',
            overflow: 'auto',
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#e4e4e7',
            zIndex: 2147483647,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          {explainText || '—'}
        </div>
      ) : null}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isError ? '#7f1d1d' : '#14532d',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 2147483647,
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  )
}

export function initSelectionMenu() {
  ensureShadowMount()

  document.addEventListener('selectionchange', updateSelectionSnapshot)

  /** capture：先于页面冒泡里清空选区的逻辑，尽量读到真实 Range */
  document.addEventListener(
    'mouseup',
    (e) => {
      const selection = window.getSelection()
      const selected = selection?.toString().trim() ?? ''

      if (eventPathIncludesBrandHost(e)) {
        return
      }

      if (!selected || selected.length < 1) {
        closeMenu()
        return
      }

      console.log(`${LOG_PREFIX} selected:`, selected)

      let rect: DOMRect | null = null
      if (selection && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect()
      } else if (
        lastSelectionSnapshot &&
        lastSelectionSnapshot.text === selected
      ) {
        console.info(
          `${LOG_PREFIX} rangeCount=0 but text matches cache (e.g. X.com cleared range); using cached rect`,
        )
        rect = lastSelectionSnapshot.rect
      }

      if (!rect || (rect.width === 0 && rect.height === 0)) {
        const fallback = new DOMRect(e.clientX, e.clientY, 0, 0)
        console.warn(
          `${LOG_PREFIX} no usable rect; anchoring menu to pointer`,
          { rangeCount: selection?.rangeCount, selected },
        )
        rect = fallback
      }

      /** fixed + getBoundingClientRect 均为视口坐标，禁止再加 scrollX/Y（否则菜单会跑出屏幕） */
      const top =
        rect.height > 0 || rect.width > 0
          ? rect.top - 48
          : e.clientY - 48
      const left =
        rect.height > 0 || rect.width > 0
          ? rect.left + rect.width / 2
          : e.clientX

      reactRoot?.render(
        <FloatingMenu
          text={selected}
          top={top}
          left={left}
          onDone={closeMenu}
        />,
      )
    },
    true,
  )

  document.addEventListener('mousedown', (e) => {
    if (eventPathIncludesBrandHost(e)) return
    closeMenu()
  })
}
