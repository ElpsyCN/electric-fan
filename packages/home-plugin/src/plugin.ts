import type { FanAction, FanState } from '@yunlefun-home/electric-fan/core'
import { createFanState, expireFanTimer, fanReducer, fanSummary, fanTone, isFanAction, normalizeFanState } from '@yunlefun-home/electric-fan/core'

/**
 * Yun Home sandbox plugin contract, SDK version 1: pure functions over JSON,
 * evaluated in an isolated JavaScriptCore context with no host APIs.
 */
export interface FanSandboxPlugin {
  create: () => FanState
  normalize: (value: unknown) => FanState
  isAction: (value: unknown) => value is FanAction
  reduce: (state: FanState, action: FanAction) => FanState
  present: (state: FanState) => { active: boolean, tone: string, summary: string }
}

// The sandbox has no clock-driven callbacks, so expired timers are applied
// whenever the host asks for state.
function current(value: unknown): FanState {
  return expireFanTimer(normalizeFanState(value))
}

export const electricFanPlugin: FanSandboxPlugin = {
  create: () => createFanState(),
  normalize: current,
  isAction: isFanAction,
  reduce: (state, action) => fanReducer(current(state), action),
  present(state) {
    const fan = current(state)
    return { active: fan.power, tone: fanTone(fan), summary: fanSummary(fan) }
  },
}
