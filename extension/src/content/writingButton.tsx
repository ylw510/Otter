import { getActiveAdapter } from '../adapters'
import { prefixedDomId } from '../brand'
import { getInputText } from '../utils/dom'
import { openRewritePanel } from './rewritePanel'

const SELECTORS = 'textarea, [contenteditable="true"], input[type="text"]'

function collectInputs(): HTMLElement[] {
  const adapter = getActiveAdapter()
  const fromAdapter = adapter?.getInputBoxes() ?? []
  const generic = Array.from(
    document.querySelectorAll<HTMLElement>(SELECTORS),
  )
  const seen = new Set<HTMLElement>()
  const out: HTMLElement[] = []
  for (const el of [...fromAdapter, ...generic]) {
    if (!seen.has(el)) {
      seen.add(el)
      out.push(el)
    }
  }
  return out
}

export function initWritingButtons() {
  let lastUrl = location.href
  const observer = new MutationObserver(() => {
    scanInputs()
    if (location.href !== lastUrl) {
      lastUrl = location.href
      window.setTimeout(scanInputs, 500)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('popstate', () => {
    lastUrl = location.href
    window.setTimeout(scanInputs, 500)
  })
  scanInputs()
}

function scanInputs() {
  collectInputs().forEach(attachButton)
}

function attachButton(input: HTMLElement) {
  if (input.dataset.copilotWritingAttached) return
  input.dataset.copilotWritingAttached = 'true'

  const host = document.createElement('div')
  host.id = `${prefixedDomId('writing')}-${crypto.randomUUID()}`
  const shadow = host.attachShadow({ mode: 'open' })
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = '✨'
  btn.title = 'AI Rewrite (Copilot)'
  btn.style.width = '32px'
  btn.style.height = '28px'
  btn.style.background = '#6366f1'
  btn.style.border = 'none'
  btn.style.borderRadius = '6px'
  btn.style.color = 'white'
  btn.style.fontSize = '14px'
  btn.style.cursor = 'pointer'
  btn.style.opacity = '0'
  btn.style.transition = 'opacity 0.2s'
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
  shadow.appendChild(btn)
  document.body.appendChild(host)

  const reposition = () => {
    const r = input.getBoundingClientRect()
    const pad = 8
    host.style.cssText = [
      'position:fixed',
      'z-index:2147483640',
      `top:${r.bottom - 36 - pad}px`,
      `left:${r.right - 44 - pad}px`,
    ].join(';')
  }

  input.addEventListener('focus', () => {
    reposition()
    btn.style.opacity = '1'
  })
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      btn.style.opacity = '0'
    }, 180)
  })
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)

  btn.addEventListener('mousedown', (e) => {
    e.preventDefault()
  })

  btn.addEventListener('click', () => {
    const t = getInputText(input).trim()
    if (!t) return
    openRewritePanel(t, input)
  })
}
