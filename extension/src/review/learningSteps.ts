export const DEFAULT_LEARNING_STEPS = ['1m', '10m', '1d'] as const
export const DEFAULT_RELEARNING_STEPS = ['10m', '1d'] as const

const STEP_RE = /^(\d+)(m|h|d)$/

/** Parse compact step strings (e.g. `10m`, `1d`) to milliseconds. */
export function parseStepToMs(step: string): number {
  const m = STEP_RE.exec(step.trim())
  if (!m) {
    throw new Error(`Invalid learning step: ${step}`)
  }
  const n = Number.parseInt(m[1], 10)
  switch (m[2]) {
    case 'm':
      return n * 60_000
    case 'h':
      return n * 3_600_000
    case 'd':
      return n * 86_400_000
    default:
      throw new Error(`Invalid learning step: ${step}`)
  }
}

export function stepDelayMs(
  steps: readonly string[],
  stepIndex: number,
): number {
  if (steps.length === 0) {
    return 86_400_000
  }
  const i = Math.min(Math.max(0, stepIndex), steps.length - 1)
  return parseStepToMs(steps[i]!)
}
