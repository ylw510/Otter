import { STORAGE_KEYS } from '../constants'

const PDF_VIEWER_PATH = 'src/pdf-viewer/index.html'

export function pdfViewerUrl(params?: { url?: string }): string {
  const base = chrome.runtime.getURL(PDF_VIEWER_PATH)
  if (!params?.url) return base
  return `${base}?url=${encodeURIComponent(params.url)}`
}

/** Read a local PDF in popup, stash bytes in session storage, open viewer tab. */
export async function openLocalPdfFile(file: File): Promise<void> {
  const buf = await file.arrayBuffer()
  const bytes = Array.from(new Uint8Array(buf))
  await chrome.storage.session.set({
    [STORAGE_KEYS.pendingPdfBytes]: bytes,
    [STORAGE_KEYS.pendingPdfName]: file.name,
    [STORAGE_KEYS.pendingPdfUrl]: '',
  })
  await chrome.tabs.create({ url: pdfViewerUrl() })
}

export async function openPdfViewerHome(): Promise<void> {
  await chrome.tabs.create({ url: pdfViewerUrl() })
}

export async function readPendingPdfFromSession(): Promise<{
  data: Uint8Array | null
  name: string
  remoteUrl: string
}> {
  const stored = await chrome.storage.session.get([
    STORAGE_KEYS.pendingPdfBytes,
    STORAGE_KEYS.pendingPdfName,
    STORAGE_KEYS.pendingPdfUrl,
  ])
  const raw = stored[STORAGE_KEYS.pendingPdfBytes] as number[] | undefined
  const data = raw?.length ? new Uint8Array(raw) : null
  const name = (stored[STORAGE_KEYS.pendingPdfName] as string | undefined) ?? ''
  const remoteUrl =
    (stored[STORAGE_KEYS.pendingPdfUrl] as string | undefined) ?? ''
  if (data) {
    await chrome.storage.session.remove([
      STORAGE_KEYS.pendingPdfBytes,
      STORAGE_KEYS.pendingPdfName,
      STORAGE_KEYS.pendingPdfUrl,
    ])
  }
  return { data, name, remoteUrl }
}
