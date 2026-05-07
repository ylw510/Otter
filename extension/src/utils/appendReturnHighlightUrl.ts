import { HIGHLIGHT_PARAM } from '../brand'

/**
 * Appends a fragment flag so the content script can find and highlight the saved phrase.
 * Preserves any existing hash and merges with the highlight fragment.
 */
export function appendReturnHighlightUrl(url: string, phrase: string): string {
  const trimmed = phrase.trim()
  if (!trimmed) {
    return url
  }
  try {
    const u = new URL(url)
    const h = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    const segments = h
      ? h.split('&').filter((p) => !p.startsWith(`${HIGHLIGHT_PARAM}=`))
      : []
    segments.push(`${HIGHLIGHT_PARAM}=${encodeURIComponent(trimmed)}`)
    u.hash = segments.join('&')
    return u.toString()
  } catch {
    return url
  }
}
