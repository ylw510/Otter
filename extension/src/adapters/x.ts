import type { SiteAdapter } from './types'

/** X (Twitter) composer and DM inputs — selectors may change; keep adapter isolated. */
export const xAdapter: SiteAdapter = {
  id: 'x',
  match() {
    const h = location.hostname.replace(/^www\./, '')
    return h === 'x.com' || h === 'twitter.com'
  },
  getInputBoxes() {
    const sel =
      'div[data-testid="tweetTextarea_0"], div[data-testid="dmComposerTextInput"]'
    return Array.from(document.querySelectorAll<HTMLElement>(sel))
  },
  injectRewriteButton() {
    /* Global writingButton flow attaches to inputs; X-specific chrome can go here later. */
  },
  extractContext() {
    return document.title || ''
  },
}
