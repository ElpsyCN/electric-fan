import type { FanAction, FanLevel, FanState, FanTone } from './types'

/** Seconds per blade revolution at each level; level 0 is the old coast-down time, kept for compatibility. */
export const fanSpinSeconds: Record<FanLevel, number> = { 0: 3, 1: 2, 2: 1.5, 3: 0.8 }

/** Longest auto-off timer, one day. */
export const maxFanTimerMinutes = 1440

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function normalizeDate(value: unknown, fallback = new Date().toISOString()): string {
  if (typeof value === 'string' && Number.isFinite(Date.parse(value)))
    return new Date(value).toISOString()
  return fallback
}

function normalizeNullableDate(value: unknown): string | null {
  if (value === null)
    return null
  return normalizeDate(value, '') || null
}

function timerDate(minutes: number | null, now: string): string | null {
  if (minutes === null)
    return null
  return new Date(Date.parse(now) + Math.min(maxFanTimerMinutes, Math.max(0, minutes)) * 60_000).toISOString()
}

function isTimerMinutes(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maxFanTimerMinutes)
}

/**
 * Create a fan that is off at speed 1.
 *
 * @param changedAt - ISO timestamp of the state change
 */
export function createFanState(changedAt = new Date().toISOString()): FanState {
  return { power: false, speed: 1, oscillating: false, natural: false, autoOffAt: null, stateChangedAt: changedAt }
}

/**
 * Coerce an untrusted value into a valid fan state.
 *
 * @param value - Stored or remote state
 * @returns A state with a known speed and normalized timestamps
 */
export function normalizeFanState(value: unknown): FanState {
  if (!isRecord(value))
    return createFanState()
  return {
    power: typeof value.power === 'boolean' ? value.power : false,
    speed: (value.speed === 2 || value.speed === 3) ? value.speed : 1,
    oscillating: typeof value.oscillating === 'boolean' ? value.oscillating : false,
    natural: typeof value.natural === 'boolean' ? value.natural : false,
    autoOffAt: normalizeNullableDate(value.autoOffAt),
    stateChangedAt: normalizeDate(value.stateChangedAt),
  }
}

/**
 * Apply an action. Picking a speed or a non-zero level also powers the fan on.
 *
 * @param state - Current state
 * @param action - Action to apply
 * @param now - ISO timestamp of the change
 */
export function fanReducer(state: FanState, action: FanAction, now = new Date().toISOString()): FanState {
  switch (action.type) {
    case 'toggle':
      return { ...state, power: !state.power, stateChangedAt: now }
    case 'set-speed':
      return { ...state, power: true, speed: action.speed, stateChangedAt: now }
    case 'set-level':
      return action.level === 0
        ? { ...state, power: false, stateChangedAt: now }
        : { ...state, power: true, speed: action.level, stateChangedAt: now }
    case 'toggle-oscillation':
      return { ...state, oscillating: !state.oscillating, stateChangedAt: now }
    case 'set-oscillation':
      return { ...state, oscillating: action.oscillating, stateChangedAt: now }
    case 'toggle-natural':
      return { ...state, natural: !state.natural, stateChangedAt: now }
    case 'set-natural':
      return { ...state, natural: action.natural, stateChangedAt: now }
    case 'set-timer':
      return { ...state, autoOffAt: timerDate(action.minutes, now), stateChangedAt: now }
  }
}

/**
 * Validate an untrusted action.
 *
 * @param value - Candidate action
 */
export function isFanAction(value: unknown): value is FanAction {
  if (!isRecord(value) || typeof value.type !== 'string')
    return false
  switch (value.type) {
    case 'toggle':
    case 'toggle-oscillation':
    case 'toggle-natural':
      return true
    case 'set-speed':
      return value.speed === 1 || value.speed === 2 || value.speed === 3
    case 'set-level':
      return value.level === 0 || value.level === 1 || value.level === 2 || value.level === 3
    case 'set-oscillation':
      return typeof value.oscillating === 'boolean'
    case 'set-natural':
      return typeof value.natural === 'boolean'
    case 'set-timer':
      return isTimerMinutes(value.minutes)
    default:
      return false
  }
}

/**
 * Turn the fan off once its auto-off time has passed.
 *
 * @param state - Current state
 * @param now - ISO timestamp to compare against
 * @returns The same object when nothing expired
 */
export function expireFanTimer(state: FanState, now = new Date().toISOString()): FanState {
  if (!state.autoOffAt || Date.parse(state.autoOffAt) > Date.parse(now))
    return state
  return { ...state, power: false, autoOffAt: null, stateChangedAt: now }
}

/** Front-switch level for a state: 0 when off. */
export function fanLevel(state: Pick<FanState, 'power' | 'speed'>): FanLevel {
  return state.power ? state.speed : 0
}

export function fanTone(state: Pick<FanState, 'power'>): FanTone {
  return state.power ? 'active' : 'idle'
}

/** One-line status, e.g. "2 档 · 摇头" or "2 档 · 摇头 · 自然风". */
export function fanSummary(state: FanState): string {
  if (!state.power)
    return '已关闭'
  return [`${state.speed} 档`, state.oscillating ? '摇头' : '定向', ...(state.natural ? ['自然风'] : [])].join(' · ')
}
