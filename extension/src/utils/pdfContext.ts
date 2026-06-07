/** True when running inside Otter's PDF.js viewer page. */
export function isPdfViewerPage(): boolean {
  return document.documentElement.dataset.otterPdfViewer === 'true'
}

/** Label for saved-word metadata on PDF pages. */
export function pdfSiteLabel(): string {
  const title = document.title.replace(/^PDF · /, '').trim()
  return title ? `PDF:${title}` : 'PDF'
}

/**
 * PDF text layers often lack sentence punctuation in one DOM node;
 * expand to sibling text in the same textLayer block.
 */
export function getPdfContextSentence(selectedText: string): string {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return selectedText

  const range = selection.getRangeAt(0)
  const container = range.commonAncestorContainer
  const parentEl =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as Element)

  const layer =
    parentEl?.closest('.textLayer') ??
    parentEl?.closest('[data-otter-page-text]')
  const fullText = (layer?.textContent ?? parentEl?.textContent ?? '').replace(
    /\s+/g,
    ' ',
  )
  if (!fullText) return selectedText

  const idx = fullText.indexOf(selectedText.replace(/\s+/g, ' '))
  if (idx < 0) {
    return fullText.slice(0, 280)
  }

  const before = fullText.slice(0, idx)
  const after = fullText.slice(idx + selectedText.length)
  const start = Math.max(
    before.lastIndexOf('. ') + 1,
    before.lastIndexOf('! ') + 1,
    before.lastIndexOf('? ') + 1,
    Math.max(0, before.length - 120),
  )
  const endRel = after.search(/[.!?]\s/)
  const end =
    endRel >= 0
      ? idx + selectedText.length + endRel + 1
      : Math.min(fullText.length, idx + selectedText.length + 120)

  return fullText.slice(start, end).trim() || selectedText
}
