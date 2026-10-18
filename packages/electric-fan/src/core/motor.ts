import type { FanLevel } from './types'
import { fanSpinSeconds } from './state'

/**
 * Rotor and head of a running fan. Pure data: hosts advance it with
 * {@link stepFanMotor} once per frame and draw from it.
 */
export interface FanMotor {
  /** Blade angle in degrees, kept in [0, 360) */
  angle: number
  /** Blade speed in revolutions per second */
  speed: number
  /** Oscillation phase in radians; the head yaw follows its sine */
  phase: number
  /** Head yaw in degrees, positive turns to the viewer's right */
  yaw: number
}

export interface FanMotorInput {
  /** 0 = off, 1–3 = speed */
  level: FanLevel
  oscillating: boolean
  natural: boolean
  /** Seconds on any steady clock; drives the natural-wind gusts */
  time: number
}

/** Top speed, at level 3, in revolutions per second. */
export const fanMaxRevsPerSecond = 1 / fanSpinSeconds[3]

/** Widest head swing to either side, in degrees. */
export const fanYawAmplitude = 36

/** Seconds per full left–right–left sweep at full drive. */
export const fanOscillationSeconds = 7

// Spin-up follows the motor torque toward the target; ~95% after 3τ.
const SPIN_UP_TAU = 0.8
// Coasting loses speed to bearing friction plus air drag (∝ ω²), so it
// brakes hard at first and drifts for a while at the end: ~6 s from level 3.
const FRICTION = 0.12
const AIR_DRAG = 0.3
const REST_SPEED = 0.002
const MAX_STEP = 1 / 30
// Long gaps (a hidden tab) are simulated up to this many seconds.
const MAX_GAP = 10

export function createFanMotor(): FanMotor {
  return { angle: 0, speed: 0, phase: 0, yaw: 0 }
}

/**
 * Natural-wind gust factor at a moment: a smooth, never-repeating swell
 * between 0.3 and 1 built from incommensurate sines.
 *
 * @param time - Seconds
 */
export function naturalBreeze(time: number): number {
  const wave = Math.sin(time * 0.53) * 0.5 + Math.sin(time * 1.31 + 1.3) * 0.3 + Math.sin(time * 2.71 + 0.4) * 0.2
  const gust = (wave + 1) / 2
  return 0.3 + 0.7 * gust * gust * (3 - 2 * gust)
}

/**
 * Speed the motor is driving toward, in revolutions per second.
 */
export function fanTargetSpeed(input: Pick<FanMotorInput, 'level' | 'natural' | 'time'>): number {
  if (input.level === 0)
    return 0
  const steady = 1 / fanSpinSeconds[input.level]
  return input.natural ? steady * naturalBreeze(input.time) : steady
}

/** Blade speed as a share of top speed, 0–1; handy for sound and wind effects. */
export function fanMotorRatio(motor: Pick<FanMotor, 'speed'>): number {
  return Math.min(1, Math.max(0, motor.speed / fanMaxRevsPerSecond))
}

function step(motor: FanMotor, input: FanMotorInput, dt: number): FanMotor {
  const target = fanTargetSpeed(input)
  let speed = motor.speed
  if (target > speed) {
    speed += (target - speed) * (1 - Math.exp(-dt / SPIN_UP_TAU))
  }
  else {
    speed = Math.max(target, speed - (FRICTION + AIR_DRAG * speed * speed) * dt)
    if (target === 0 && speed < REST_SPEED)
      speed = 0
  }
  // The oscillation gear rides on the motor shaft: it sweeps while the blades
  // turn, slows as they coast, and leaves the head wherever it stopped.
  const drive = input.oscillating ? Math.min(1, speed / (1 / fanSpinSeconds[1])) : 0
  const phase = (motor.phase + drive * dt * 2 * Math.PI / fanOscillationSeconds) % (2 * Math.PI)
  const angle = (motor.angle + (motor.speed + speed) / 2 * 360 * dt) % 360
  return { angle, speed, phase, yaw: fanYawAmplitude * Math.sin(phase) }
}

/**
 * Advance the motor by `dt` seconds. Frame-rate independent; long gaps are
 * sub-stepped so a fan switched off in a background tab has stopped on return.
 *
 * @param motor - Current motor
 * @param input - Switch positions and the clock
 * @param dt - Elapsed seconds since the last step
 */
export function stepFanMotor(motor: FanMotor, input: FanMotorInput, dt: number): FanMotor {
  let remaining = Math.min(MAX_GAP, Math.max(0, dt))
  let next = motor
  while (remaining > 0) {
    const slice = Math.min(MAX_STEP, remaining)
    next = step(next, { ...input, time: input.time - remaining + slice }, slice)
    remaining -= slice
  }
  return next
}

/** True once the blades have stopped and nothing will start them. */
export function isFanMotorAtRest(motor: Pick<FanMotor, 'speed'>, level: FanLevel): boolean {
  return level === 0 && motor.speed === 0
}
