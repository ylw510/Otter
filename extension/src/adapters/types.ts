/**
 * Site-specific hooks for DOM discovery and future per-site UI.
 * Keep adapters small; share logic in content scripts when possible.
 */
export interface SiteAdapter {
  /** Stable id for logging / future settings. */
  readonly id: string
  match(): boolean
  getInputBoxes(): HTMLElement[]
  /** Reserved for sites that need explicit injection instead of the global floater. */
  injectRewriteButton(): void
  /** Short page context for prompts or logging. */
  extractContext(): string
}
