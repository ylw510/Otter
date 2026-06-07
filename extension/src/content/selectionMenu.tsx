/* Content script entry: exports init hook + inline UI — not Fast Refresh oriented */
/* eslint-disable react-refresh/only-export-components */
import { createRoot, type Root } from 'react-dom/client'
import { LOG_PREFIX, prefixedDomId } from '../brand'
import {
  FloatingMenu,
  type FloatingMenuMode,
} from './floatingMenu'

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

export type SelectionMenuOptions = {
  mode?: FloatingMenuMode
}

export function initSelectionMenu(options: SelectionMenuOptions = {}) {
  const { mode = 'web' } = options
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
        rect.height > 0 || rect.width > 0 ? rect.top - 48 : e.clientY - 48
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
          mode={mode}
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
