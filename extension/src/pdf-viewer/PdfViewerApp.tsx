import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { readPendingPdfFromSession } from '../utils/openPdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const SCALE = 1.35

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; title: string; numPages: number }
  | { kind: 'error'; message: string }

async function loadDocumentSource(): Promise<{
  data: Uint8Array | string
  title: string
}> {
  const params = new URLSearchParams(location.search)
  const urlParam = params.get('url')?.trim()
  if (urlParam) {
    return { data: urlParam, title: decodeURIComponent(urlParam.split('/').pop() ?? 'PDF') }
  }

  const pending = await readPendingPdfFromSession()
  if (pending.data) {
    return { data: pending.data, title: pending.name || 'Document.pdf' }
  }

  throw new Error('No PDF loaded. Choose a file below.')
}

export function PdfViewerApp() {
  const containerRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const renderDocument = useCallback(async (source: Uint8Array | string, title: string) => {
    const container = containerRef.current
    if (!container) return

    setState({ kind: 'loading' })
    container.replaceChildren()

    try {
      docRef.current?.destroy()
      docRef.current = null

      const loadingTask = pdfjsLib.getDocument(
        typeof source === 'string' ? { url: source } : { data: source },
      )
      const pdf = await loadingTask.promise
      docRef.current = pdf
      document.title = `PDF · ${title}`

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: SCALE })

        const wrap = document.createElement('div')
        wrap.className = 'pdf-page-wrap'
        wrap.dataset.otterPage = String(pageNum)
        wrap.style.width = `${viewport.width}px`
        wrap.style.height = `${viewport.height}px`

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        wrap.appendChild(canvas)

        const textLayerDiv = document.createElement('div')
        textLayerDiv.className = 'textLayer'
        textLayerDiv.dataset.otterPageText = String(pageNum)
        wrap.appendChild(textLayerDiv)

        container.appendChild(wrap)

        await page.render({ canvasContext: ctx, viewport }).promise

        const textContent = await page.getTextContent()
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        })
        await textLayer.render()
      }

      setState({ kind: 'ready', title, numPages: pdf.numPages })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setState({ kind: 'error', message })
    }
  }, [])

  const bootstrap = useCallback(async () => {
    try {
      const { data, title } = await loadDocumentSource()
      await renderDocument(data, title)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setState({ kind: 'error', message })
    }
  }, [renderDocument])

  useEffect(() => {
    void bootstrap()
    return () => {
      void docRef.current?.destroy()
      docRef.current = null
    }
  }, [bootstrap])

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    const buf = await file.arrayBuffer()
    await renderDocument(new Uint8Array(buf), file.name)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#525659',
        color: '#f4f4f5',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          background: 'rgba(24,24,27,0.92)',
          borderBottom: '1px solid #3f3f46',
          backdropFilter: 'blur(8px)',
        }}
      >
        <strong style={{ fontSize: '14px' }}>Otter PDF</strong>
        {state.kind === 'ready' ? (
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
            {state.title} · {state.numPages} pages · select text to translate
          </span>
        ) : null}
        <div style={{ marginLeft: 'auto' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => void onPickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            style={{
              fontSize: '12px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #52525b',
              background: '#27272a',
              color: '#fafafa',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            Open PDF…
          </button>
        </div>
      </header>

      {state.kind === 'loading' ? (
        <p style={{ padding: '24px', textAlign: 'center', color: '#d4d4d8' }}>
          Loading PDF…
        </p>
      ) : null}

      {state.kind === 'error' ? (
        <div
          style={{
            maxWidth: '480px',
            margin: '32px auto',
            padding: '16px',
            background: '#27272a',
            borderRadius: '8px',
            border: '1px solid #52525b',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: 0 }}>{state.message}</p>
          <p style={{ margin: '12px 0 0', color: '#a1a1aa' }}>
            Use <strong>Open PDF…</strong> above, or open a PDF from the Otter
            popup. For local files in Chrome, enable{' '}
            <em>Allow access to file URLs</em> on the extension details page.
          </p>
        </div>
      ) : null}

      <main
        ref={containerRef}
        style={{
          padding: '24px 16px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      />
    </div>
  )
}
