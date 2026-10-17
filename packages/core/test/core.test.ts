import { describe, expect, it } from 'vitest'
import { createFanState, expireFanTimer, fanLevel, fanReducer, fanSummary, fanTone, isFanAction, normalizeFanState } from '../src'

const changedAt = '2026-07-15T08:00:00.000Z'

describe('@yunlefun-home/electric-fan-core', () => {
  it('matches the Yun Home fan contract', () => {
    let state = createFanState(changedAt)
    expect(state).toEqual({ power: false, speed: 1, oscillating: false, autoOffAt: null, stateChangedAt: changedAt })
    state = fanReducer(state, { type: 'set-speed', speed: 3 }, changedAt)
    state = fanReducer(state, { type: 'toggle-oscillation' }, changedAt)
    state = fanReducer(state, { type: 'set-timer', minutes: 30 }, changedAt)
    expect(state).toEqual({ power: true, speed: 3, oscillating: true, autoOffAt: '2026-07-15T08:30:00.000Z', stateChangedAt: changedAt })
    expect(normalizeFanState({ power: 'yes', speed: 7, oscillating: true, autoOffAt: 'nope', stateChangedAt: changedAt }))
      .toEqual({ power: false, speed: 1, oscillating: true, autoOffAt: null, stateChangedAt: changedAt })
  })

  it('maps the front-switch level to power and speed', () => {
    const on = fanReducer(createFanState(changedAt), { type: 'set-level', level: 2 }, changedAt)
    expect(on).toMatchObject({ power: true, speed: 2 })
    expect(fanLevel(on)).toBe(2)
    const off = fanReducer(on, { type: 'set-level', level: 0 }, changedAt)
    expect(off).toMatchObject({ power: false, speed: 2 })
    expect(fanLevel(off)).toBe(0)
    expect(fanTone(on)).toBe('active')
    expect(fanSummary(on)).toBe('2 档 · 定向')
  })

  it('validates untrusted actions', () => {
    expect(isFanAction({ type: 'set-level', level: 3 })).toBe(true)
    expect(isFanAction({ type: 'set-level', level: 4 })).toBe(false)
    expect(isFanAction({ type: 'set-oscillation', oscillating: 'yes' })).toBe(false)
    expect(isFanAction({ type: 'set-timer', minutes: 1441 })).toBe(false)
    expect(isFanAction({ type: 'set-timer', minutes: null })).toBe(true)
  })

  it('expires the auto-off timer', () => {
    const timed = fanReducer(fanReducer(createFanState(changedAt), { type: 'toggle' }, changedAt), { type: 'set-timer', minutes: 1 }, changedAt)
    expect(expireFanTimer(timed, '2026-07-15T08:00:30.000Z')).toBe(timed)
    expect(expireFanTimer(timed, '2026-07-15T08:01:00.000Z')).toMatchObject({ power: false, autoOffAt: null })
  })
})
