/* eslint-disable react-refresh/only-export-components */
import { createRoot, type Root } from 'react-dom/client'
import type { ExplainRequest, Message } from '../types'
import { DOM_ID_PREFIX, prefixedDomId } from '../brand'
import {
  loadAppConfig,
  normalizeHoverTranslateEnabled,
} from '../config/appConfig'
import { STORAGE_KEYS } from '../constants'

const HOVER_DELAY_MS = 800

let hoverHost: HTMLDivElement | null = null
let hoverRoot: Root | null = null
let hoverTimer: ReturnType<typeof setTimeout> | null = null
let lastEvent: MouseEvent | null = null
let hoverTranslateEnabled = true

function isCopilotUi(e: MouseEvent): boolean {
  return e.composedPath().some(
    (n) =>
      n instanceof HTMLElement &&
      Boolean(n.id && n.id.startsWith(`${DOM_ID_PREFIX}-`)),
  )
}

function ensureHoverMount() {
  if (hoverHost) return
  hoverHost = document.createElement('div')
  hoverHost.id = prefixedDomId('hover-host')
  document.body.appendChild(hoverHost)
  const shadow = hoverHost.attachShadow({ mode: 'open' })
  const mount = document.createElement('div')
  shadow.appendChild(mount)
  hoverRoot = createRoot(mount)
}

function hideTooltip() {
  hoverRoot?.render(null)
}

function caretRangeFromPoint(x: number, y: number): Range | null {
  if (!('caretRangeFromPoint' in document)) return null
  return (
    document as Document & {
      caretRangeFromPoint(x: number, y: number): Range | null
    }
  ).caretRangeFromPoint(x, y)
}

function getHoveredWord(e: MouseEvent): string | null {
  const target = e.target as HTMLElement | null
  if (!target) return null
  const isContent = target.closest(
    'article, p, h1, h2, h3, h4, li, td, [role="article"], main, .markdown-body',
  )
  if (!isContent) return null

  const range = caretRangeFromPoint(e.clientX, e.clientY)
  if (!range) return null
  try {
    const r = range as Range & { expand?(unit: string): void }
    r.expand?.('word')
  } catch {
    return null
  }
  const raw = range.toString().trim().replace(/[^a-zA-Z'-]/g, '')
  return raw.length > 1 ? raw : null
}

type TipProps = {
  left: number
  top: number
  body: string
  loading: boolean
}

function TooltipView({ left, top, body, loading }: TipProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 2147483645,
        maxWidth: 360,
        padding: '10px 12px',
        background: '#111',
        color: '#e4e4e7',
        borderRadius: 8,
        border: '1px solid #3f3f46',
        fontSize: 12,
        lineHeight: 1.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
      }}
    >
      {loading ? '…' : body}
    </div>
  )
}

async function runHoverExplain(e: MouseEvent) {
  if (!hoverTranslateEnabled) {
    hideTooltip()
    return
  }
  if (isCopilotUi(e)) {
    hideTooltip()
    return
  }

  const word = getHoveredWord(e)
  if (!word) {
    hideTooltip()
    return
  }

  const sentence =
    (e.target instanceof Node &&
      (e.target as HTMLElement).textContent?.slice(0, 240)) ||
    ''

  const pad = 12
  const left = Math.min(e.clientX + pad, window.innerWidth - 380)
  const top = Math.min(e.clientY + pad, window.innerHeight - 120)

  hoverRoot?.render(
    <TooltipView left={left} top={top} body="" loading />,
  )

  try {
    const payload: ExplainRequest = { text: word, sentence }
    const msg: Message<ExplainRequest> = { type: 'EXPLAIN_TEXT', payload }
    const data = (await chrome.runtime.sendMessage(msg)) as {
      explanation?: string
      error?: string
    }
    if (data?.error) {
      hoverRoot?.render(
        <TooltipView
          left={left}
          top={top}
          body={data.error}
          loading={false}
        />,
      )
      return
    }
    hoverRoot?.render(
      <TooltipView
        left={left}
        top={top}
        body={data?.explanation ?? ''}
        loading={false}
      />,
    )
  } catch {
    hideTooltip()
  }
}

export function initHoverExplain() {
  ensureHoverMount()

  void loadAppConfig().then((c) => {
    hoverTranslateEnabled = c.hoverTranslateEnabled
  })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    const ch = changes[STORAGE_KEYS.hoverTranslateEnabled]
    if (!ch) return
    hoverTranslateEnabled = normalizeHoverTranslateEnabled(ch.newValue)
    if (!hoverTranslateEnabled) {
      if (hoverTimer) clearTimeout(hoverTimer)
      hideTooltip()
    }
  })

  const onMove = (e: MouseEvent) => {
    lastEvent = e
    if (hoverTimer) clearTimeout(hoverTimer)
    hideTooltip()
    if (!hoverTranslateEnabled) return
    hoverTimer = window.setTimeout(() => {
      if (lastEvent) void runHoverExplain(lastEvent)
    }, HOVER_DELAY_MS)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('scroll', hideTooltip, true)

  window.addEventListener(
    'blur',
    () => {
      if (hoverTimer) clearTimeout(hoverTimer)
      hideTooltip()
    },
    true,
  )
}
