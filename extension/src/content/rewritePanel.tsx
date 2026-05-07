/* eslint-disable react-refresh/only-export-components */
import { createRoot, type Root } from 'react-dom/client'
import { useEffect, useState, type CSSProperties } from 'react'
import { prefixedDomId } from '../brand'
import {
  type Message,
  type RewriteRequest,
  type RewriteResponse,
  type RewriteResult,
  type RewriteStyle,
  DEFAULT_STYLES,
} from '../types'
import { setInputText } from '../utils/dom'

const STYLE_LABEL: Record<RewriteStyle, string> = {
  professional: 'Professional',
  native: 'Native',
  casual: 'Casual',
  twitter_tech: 'Tech Twitter',
}

let rewriteHost: HTMLDivElement | null = null
let rewriteRoot: Root | null = null

function ensureRewriteMount() {
  if (rewriteHost) return
  rewriteHost = document.createElement('div')
  rewriteHost.id = prefixedDomId('rewrite-host')
  document.body.appendChild(rewriteHost)
  const shadow = rewriteHost.attachShadow({ mode: 'open' })
  const mount = document.createElement('div')
  shadow.appendChild(mount)
  rewriteRoot = createRoot(mount)
}

export function closeRewritePanel() {
  rewriteRoot?.render(null)
}

type PanelProps = {
  text: string
  targetInput: HTMLElement
  onClose: () => void
}

function RewritePanelView({ text, targetInput, onClose }: PanelProps) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [results, setResults] = useState<RewriteResult[] | null>(null)

  useEffect(() => {
    const payload: RewriteRequest = { text, styles: DEFAULT_STYLES }
    const msg: Message<RewriteRequest> = {
      type: 'REWRITE_TEXT',
      payload,
    }
    chrome.runtime
      .sendMessage(msg)
      .then((data: RewriteResponse & { error?: string }) => {
        if (data?.error) {
          setErr(typeof data.error === 'string' ? data.error : '请求失败')
          setLoading(false)
          return
        }
        setResults(data.results ?? [])
        setLoading(false)
      })
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      })
  }, [text])

  const apply = (t: string) => {
    setInputText(targetInput, t)
    onClose()
  }

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 2147483646,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  }

  const card: CSSProperties = {
    background: '#111',
    color: '#f4f4f5',
    borderRadius: '12px',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    border: '1px solid #27272a',
  }

  return (
    <div style={overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid #27272a',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600 }}>AI Rewrite</span>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px' }}>
            Original
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#d4d4d8',
              marginBottom: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {text}
          </div>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa' }}>
              Generating…
            </div>
          ) : err ? (
            <div style={{ color: '#f87171', fontSize: '13px' }}>{err}</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {(results ?? []).map((r) => (
                <li
                  key={r.style}
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    background: '#18181b',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#a78bfa',
                      marginBottom: '6px',
                    }}
                  >
                    {STYLE_LABEL[r.style]}
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                    {r.text}
                  </div>
                  <button
                    type="button"
                    style={{
                      fontSize: '12px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#6366f1',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => apply(r.text)}
                  >
                    Replace input
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function openRewritePanel(text: string, targetInput: HTMLElement) {
  ensureRewriteMount()
  rewriteRoot?.render(
    <RewritePanelView
      text={text}
      targetInput={targetInput}
      onClose={closeRewritePanel}
    />,
  )
}
