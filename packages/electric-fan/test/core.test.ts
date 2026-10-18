import { describe, expect, it } from 'vitest'
import { createFanMotor, createFanState, expireFanTimer, fanLevel, fanMaxRevsPerSecond, fanMotorRatio, fanReducer, fanSummary, fanTargetSpeed, fanTimerMinutesLeft, fanTone, fanYawAmplitude, isFanAction, isFanMotorAtRest, naturalBreeze, nextFanTimerMinutes, normalizeFanState, stepFanMotor } from '../src/core'

const changedAt = '2026-07-15T08:00:00.000Z'

describe('@yunlefun-home/electric-fan/core', () => {
  it('matches the Yun Home fan contract', () => {
    let state = createFanState(changedAt)
    expect(state).toEqual({ power: false, speed: 1, oscillating: false, natural: false, autoOffAt: null, stateChangedAt: changedAt })
    state = fanReducer(state, { type: 'set-speed', speed: 3 }, changedAt)
    state = fanReducer(state, { type: 'toggle-oscillation' }, changedAt)
    state = fanReducer(state, { type: 'set-timer', minutes: 30 }, changedAt)
    expect(state).toEqual({ power: true, speed: 3, oscillating: true, natural: false, autoOffAt: '2026-07-15T08:30:00.000Z', stateChangedAt: changedAt })
    expect(normalizeFanState({ power: 'yes', speed: 7, oscillating: true, autoOffAt: 'nope', stateChangedAt: changedAt }))
      .toEqual({ power: false, speed: 1, oscillating: true, natural: false, autoOffAt: null, stateChangedAt: changedAt })
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
    expect(isFanAction({ type: 'toggle-natural' })).toBe(true)
    expect(isFanAction({ type: 'set-natural', natural: 1 })).toBe(false)
  })

  it('toggles natural wind and reports it', () => {
    const state = fanReducer(fanReducer(createFanState(changedAt), { type: 'set-level', level: 1 }, changedAt), { type: 'toggle-natural' }, changedAt)
    expect(state.natural).toBe(true)
    expect(fanSummary(state)).toBe('1 档 · 定向 · 自然风')
    expect(fanReducer(state, { type: 'set-natural', natural: false }, changedAt).natural).toBe(false)
  })

  it('expires the auto-off timer', () => {
    const timed = fanReducer(fanReducer(createFanState(changedAt), { type: 'toggle' }, changedAt), { type: 'set-timer', minutes: 1 }, changedAt)
    expect(expireFanTimer(timed, '2026-07-15T08:00:30.000Z')).toBe(timed)
    expect(expireFanTimer(timed, '2026-07-15T08:01:00.000Z')).toMatchObject({ power: false, autoOffAt: null })
  })

  it('steps through timer presets', () => {
    const now = Date.parse(changedAt)
    const at = (minutes: number | null) => ({ autoOffAt: minutes === null ? null : new Date(now + minutes * 60_000).toISOString() })
    expect(nextFanTimerMinutes(at(null), now)).toBe(30)
    expect(nextFanTimerMinutes(at(25), now)).toBe(60)
    expect(nextFanTimerMinutes(at(60), now)).toBe(120)
    expect(nextFanTimerMinutes(at(100), now)).toBe(null)
    expect(fanTimerMinutesLeft(at(25), now)).toBe(25)
    expect(fanTimerMinutesLeft(at(null), now)).toBe(null)
  })

  describe('motor', () => {
    const run = (input: Parameters<typeof stepFanMotor>[1], seconds: number, motor = createFanMotor()) => {
      for (let t = 0; t < seconds; t += 1 / 60)
        motor = stepFanMotor(motor, { ...input, time: input.time + t }, 1 / 60)
      return motor
    }
    const on = { level: 3, oscillating: false, natural: false, time: 0 } as const

    it('spins up over a couple of seconds instead of jumping to speed (#8)', () => {
      expect(fanMotorRatio(run(on, 0.3))).toBeLessThan(0.4)
      expect(fanMotorRatio(run(on, 1))).toBeGreaterThan(0.6)
      expect(fanMotorRatio(run(on, 3))).toBeGreaterThan(0.95)
    })

    it('coasts to a stop after power off (#11)', () => {
      const spinning = run(on, 4)
      const off = { ...on, level: 0 } as const
      expect(fanMotorRatio(run(off, 1, spinning))).toBeGreaterThan(0.3)
      expect(run(off, 3, spinning).speed).toBeGreaterThan(0)
      const stopped = run(off, 8, spinning)
      expect(stopped.speed).toBe(0)
      expect(isFanMotorAtRest(stopped, 0)).toBe(true)
    })

    it('moves the blades smoothly at any frame rate (#5)', () => {
      const motor = { ...createFanMotor(), speed: fanMaxRevsPerSecond }
      const a = stepFanMotor(motor, on, 1 / 30)
      let b = motor
      for (let i = 0; i < 4; i++)
        b = stepFanMotor(b, { ...on, time: i / 120 }, 1 / 120)
      expect(b.angle).toBeCloseTo(a.angle, 1)
    })

    it('simulates a long background gap in one call', () => {
      const spinning = run(on, 4)
      expect(stepFanMotor(spinning, { ...on, level: 0 }, 60).speed).toBe(0)
    })

    it('gusts in natural mode (#7)', () => {
      const samples = Array.from({ length: 200 }, (_, i) => naturalBreeze(i * 0.25))
      expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.3)
      expect(Math.max(...samples)).toBeLessThanOrEqual(1)
      expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.4)
      expect(fanTargetSpeed({ level: 2, natural: true, time: 3 })).toBeLessThanOrEqual(fanTargetSpeed({ level: 2, natural: false, time: 3 }))
    })

    it('sweeps the head only while oscillating and leaves it where it stopped', () => {
      const swinging = run({ ...on, oscillating: true }, 2)
      expect(Math.abs(swinging.yaw)).toBeGreaterThan(10)
      expect(Math.abs(swinging.yaw)).toBeLessThanOrEqual(fanYawAmplitude)
      const held = run({ ...on, oscillating: false }, 1, swinging)
      expect(held.yaw).toBeCloseTo(swinging.yaw, 6)
    })
  })
})
