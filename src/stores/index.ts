import type { FanView } from '@yunlefun-home/electric-fan'
import type { FanAction, FanState } from '@yunlefun-home/electric-fan/core'
import { useStorage } from '@vueuse/core'
import { createFanState, expireFanTimer, fanLevel, fanReducer } from '@yunlefun-home/electric-fan/core'
import { computed, shallowRef } from 'vue'

/** Timer presets cycled by the 定时 button, in minutes; `null` is no timer. */
export const timerSteps = [null, 30, 60, 120] as const

// The site starts with the head sweeping, as the fan always did.
const fan = shallowRef<FanState>({ ...createFanState(), oscillating: true })

/** Fan switches, driven by the same reducer as the Yun Home plugin. */
export const fanState = computed(() => fan.value)
export const level = computed(() => fanLevel(fan.value))

export function dispatch(action: FanAction) {
  fan.value = fanReducer(fan.value, action)
}

/** Turn the fan off if its timer ran out; call on a clock. */
export function expireTimer() {
  fan.value = expireFanTimer(fan.value)
}

/** Advance to the next timer preset, from whichever one is closest to the time left. */
export function cycleTimer(now = Date.now()) {
  const left = fan.value.autoOffAt ? (Date.parse(fan.value.autoOffAt) - now) / 60_000 : null
  const current = left === null ? 0 : timerSteps.findIndex(step => step !== null && left <= step)
  const next = timerSteps[(current === -1 ? 0 : current + 1) % timerSteps.length]
  dispatch({ type: 'set-timer', minutes: next })
}

export const view = useStorage<FanView>('electric-fan:view', '3d')
export const muted = useStorage('electric-fan:muted', false)

/**
 * Latest simulated motor frame, written every animation frame. Plain object on
 * purpose: canvas and audio loops read it without triggering Vue renders.
 */
export const motorFrame = { speed: 0, ratio: 0, yaw: 0, facing: 0 }
/** The same blade speed share, sampled a few times a second for the UI. */
export const windRatio = shallowRef(0)
