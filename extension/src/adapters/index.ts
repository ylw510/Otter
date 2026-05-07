import { xAdapter } from './x'
import type { SiteAdapter } from './types'

const ADAPTERS: SiteAdapter[] = [xAdapter]

export function getActiveAdapter(): SiteAdapter | undefined {
  return ADAPTERS.find((a) => a.match())
}

export type { SiteAdapter }
export { xAdapter }
