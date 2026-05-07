export const APP_NAME = 'Otter'
export const APP_SLUG = 'otter'

export const LOG_PREFIX = `[${APP_NAME}]`
export const DOM_ID_PREFIX = APP_SLUG
export const HIGHLIGHT_PARAM = `${APP_SLUG}-hl`
export const HIGHLIGHT_ATTR = `data-${APP_SLUG}-highlight`

export function prefixedDomId(suffix: string): string {
  return `${DOM_ID_PREFIX}-${suffix}`
}
