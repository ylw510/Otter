import { fsrs, type FSRS } from 'ts-fsrs'

const OTTER_FSRS_PARAMS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ['1m', '10m', '1d'] as const,
  relearning_steps: ['10m', '1d'] as const,
}

let scheduler: FSRS = fsrs(OTTER_FSRS_PARAMS)

export function getOtterFsrs(): FSRS {
  return scheduler
}

/** For tests or future Settings UI. */
export function resetOtterFsrs(params?: Partial<typeof OTTER_FSRS_PARAMS>): void {
  scheduler = fsrs({ ...OTTER_FSRS_PARAMS, ...params })
}

export const OTTER_FSRS_REQUEST_RETENTION = OTTER_FSRS_PARAMS.request_retention
