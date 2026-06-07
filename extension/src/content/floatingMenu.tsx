/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, type CSSProperties } from 'react'
import { APP_NAME, LOG_PREFIX } from '../brand'
import type { ExplainRequest, Message, TranslateRequest } from '../types'
import { getContextSentence, siteLabel } from '../utils/dom'
import { saveWord } from '../utils/storage'

export type FloatingMenuMode = 'web' | 'pdf'

export type FloatingMenuProps = {
  text: string
  top: number
  left: number
  onDone: () => void
  mode?: FloatingMenuMode
}

export function FloatingMenu({
  text,
  top,
  left,
  onDone,
  mode = 'web',
}: FloatingMenuProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [panelText, setPanelText] = useState<string | null>(null)
  const [panelKind, setPanelKind] = useState<'explain' | 'translate' | null>(
    null,
  )

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
        e instanceof Error && e.message ? `❌ ${e.message}` : '❌ Failed'
      setToast(tip)
      setIsError(true)
    }
  }

  const handleExplain = async () => {
    setBusy(true)
    setPanelText(null)
    setPanelKind('explain')
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
        setPanelKind(null)
      } else {
        setPanelText(data?.explanation ?? '')
      }
    } catch {
      setToast('❌ Explain failed')
      setIsError(true)
      setPanelKind(null)
    } finally {
      setBusy(false)
    }
  }

  const handleTranslate = async () => {
    setBusy(true)
    setPanelText(null)
    setPanelKind('translate')
    try {
      const payload: TranslateRequest = {
        text,
        sentence: getContextSentence(text),
      }
      const msg: Message<TranslateRequest> = {
        type: 'TRANSLATE_TEXT',
        payload,
      }
      const data = (await chrome.runtime.sendMessage(msg)) as {
        translation?: string
        error?: string
      }
      if (data?.error) {
        setToast(`❌ ${data.error}`)
        setIsError(true)
        setPanelKind(null)
      } else {
        setPanelText(data?.translation ?? '')
      }
    } catch {
      setToast('❌ Translate failed')
      setIsError(true)
      setPanelKind(null)
    } finally {
      setBusy(false)
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

  const panelTitle =
    panelKind === 'translate' ? 'Translation' : 'Explanation'

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
        {mode === 'web' ? (
          <>
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
                opacity: busy ? 0.6 : 1,
              }}
              disabled={busy}
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
          </>
        ) : (
          <button
            type="button"
            style={{
              ...btnStyle,
              opacity: busy ? 0.6 : 1,
            }}
            disabled={busy}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            onClick={() => void handleTranslate()}
          >
            🌐 Translate
          </button>
        )}
      </div>
      {panelText !== null && panelKind ? (
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
          <div
            style={{
              fontSize: '11px',
              color: '#a1a1aa',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {panelTitle}
          </div>
          {panelText || '—'}
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
