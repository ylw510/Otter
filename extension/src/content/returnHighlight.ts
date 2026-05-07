import { DOM_ID_PREFIX, HIGHLIGHT_ATTR, HIGHLIGHT_PARAM } from '../brand'

const RETRY_MS = 800
const MAX_WAIT_MS = 12_000

function parseHighlightPhrase(): string | null {
  const raw = location.hash.slice(1)
  if (!raw) {
    return null
  }
  const m = raw.match(new RegExp(`(?:^|[&])${HIGHLIGHT_PARAM}=([^&]*)`))
  if (!m?.[1]) {
    return null
  }
  try {
    return decodeURIComponent(m[1]).trim() || null
  } catch {
    return null
  }
}

function stripHighlightFromUrl(): void {
  const raw = location.hash.slice(1)
  if (!raw || !raw.includes(`${HIGHLIGHT_PARAM}=`)) {
    return
  }
  const segments = raw
    .split('&')
    .filter((p) => !p.startsWith(`${HIGHLIGHT_PARAM}=`))
  const u = new URL(location.href)
  u.hash = segments.length ? segments.join('&') : ''
  history.replaceState(null, '', u.toString())
}

function parentChainOk(node: Node): boolean {
  const start = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (start?.closest(`[${HIGHLIGHT_ATTR}]`)) {
    return false
  }
  let el: HTMLElement | null = start
  while (el) {
    const tag = el.tagName
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {
      return false
    }
    if (el.id?.startsWith(`${DOM_ID_PREFIX}-`)) {
      return false
    }
    if (el.getAttribute('contenteditable') === 'true') {
      return false
    }
    el = el.parentElement
  }
  return true
}

function highlightPhraseOnce(phrase: string): boolean {
  const lower = phrase.toLowerCase()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return parentChainOk(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })

  let n: Node | null
  while ((n = walker.nextNode())) {
    const textNode = n as Text
    const text = textNode.textContent ?? ''
    const idx = text.toLowerCase().indexOf(lower)
    if (idx < 0) {
      continue
    }
    try {
      const range = document.createRange()
      range.setStart(textNode, idx)
      range.setEnd(textNode, idx + phrase.length)
      const mark = document.createElement('mark')
      mark.setAttribute(HIGHLIGHT_ATTR, '')
      mark.style.cssText =
        'background:rgba(255,235,59,.55);box-shadow:0 0 0 2px rgba(255,193,7,.35);border-radius:2px;'
      range.surroundContents(mark)
      mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return true
    } catch {
      /* range may cross boundaries — skip this node */
    }
  }
  return false
}

export function initReturnHighlight(): void {
  const phrase = parseHighlightPhrase()
  if (!phrase) {
    return
  }

  const started = Date.now()
  let done = false

  const finish = () => {
    if (done) {
      return
    }
    done = true
    obs.disconnect()
    stripHighlightFromUrl()
  }

  const tryOnce = (): boolean => {
    if (done) {
      return true
    }
    return highlightPhraseOnce(phrase)
  }

  const tick = () => {
    if (tryOnce()) {
      finish()
      return
    }
    if (Date.now() - started > MAX_WAIT_MS) {
      finish()
      return
    }
    window.setTimeout(tick, RETRY_MS)
  }

  const obs = new MutationObserver(() => {
    if (tryOnce()) {
      finish()
    }
  })
  obs.observe(document.body, { childList: true, subtree: true })

  tick()

  window.setTimeout(() => {
    if (!done) {
      finish()
    }
  }, MAX_WAIT_MS)
}
