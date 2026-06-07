import {
  getPdfContextSentence,
  isPdfViewerPage,
  pdfSiteLabel,
} from './pdfContext'

/** 获取所选文字所在句子的近似上下文 */
export function getContextSentence(selectedText: string): string {
  if (isPdfViewerPage()) {
    return getPdfContextSentence(selectedText)
  }

  const selection = window.getSelection()
  if (!selection?.rangeCount) return ''

  const range = selection.getRangeAt(0)
  const container = range.commonAncestorContainer
  const parentEl =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as Element)

  const fullText = parentEl?.textContent ?? ''
  const sentenceRegex = /[^.!?]*[.!?]/g
  const sentences = fullText.match(sentenceRegex) ?? []
  const contextSentence = sentences.find((s) => s.includes(selectedText))
  return contextSentence?.trim() ?? fullText.slice(0, 200)
}

/** 用于展示的站点标签（X / GitHub / hostname） */
export function siteLabel(): string {
  if (isPdfViewerPage()) {
    return pdfSiteLabel()
  }

  const h = location.hostname.replace(/^www\./, '')
  if (h === 'x.com' || h === 'twitter.com') return 'X'
  if (h.includes('github')) return 'GitHub'
  return h
}

export function getInputText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value
  }
  return el.innerText || el.textContent || ''
}

/**
 * 仅改 contenteditable 的 textContent 不会更新 X / React(Lexical 等) 的内部草稿，
 * 界面上可能短暂看到英文，「发送」仍提交内存里的旧文本。
 * 用 execCommand insertText 模拟用户输入，使框架同步状态。
 */
function setContentEditableText(root: HTMLElement, text: string): void {
  const target =
    root.isContentEditable && root.getAttribute('contenteditable') !== 'false'
      ? root
      : (root.querySelector('[contenteditable="true"]') as HTMLElement | null) ??
        root

  target.focus()

  const sel = window.getSelection()
  if (!sel) {
    target.textContent = text
    target.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    )
    return
  }

  const range = document.createRange()
  range.selectNodeContents(target)
  sel.removeAllRanges()
  sel.addRange(range)

  const ok =
    typeof document.execCommand === 'function' &&
    document.execCommand('insertText', false, text)

  if (!ok) {
    target.textContent = text
    target.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    )
  }
}

/** 尽量兼容 React 受控输入（如 X / GitHub 文本框） */
export function setInputText(el: HTMLElement, text: string): void {
  if (el instanceof HTMLTextAreaElement) {
    const set = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set
    set?.call(el, text)
  } else if (el instanceof HTMLInputElement) {
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set
    set?.call(el, text)
  } else {
    setContentEditableText(el, text)
    return
  }
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
