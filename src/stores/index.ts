import type { FanAction, FanState } from '@yunlefun-home/electric-fan/core'
import { useStorage } from '@vueuse/core'
import { createFanState, expireFanTimer, fanLevel, fanReducer, nextFanTimerMinutes } from '@yunlefun-home/electric-fan/core'
import { computed, shallowRef } from 'vue'

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

/** Advance the timer to its next preset, as turning the dial does. */
export function cycleTimer() {
  dispatch({ type: 'set-timer', minutes: nextFanTimerMinutes(fan.value) })
}

export const muted = useStorage('electric-fan:muted', false)

/** How talking into the fan is heard: live through headphones, or recorded and replayed. */
export type VoiceMode = 'live' | 'replay'
export const voiceMode = useStorage<VoiceMode>('electric-fan:voice-mode', 'live')

/**
 * Latest simulated motor frame, written every animation frame. Plain object on
 * purpose: canvas and audio loops read it without triggering Vue renders.
 */
export const motorFrame = { speed: 0, ratio: 0, yaw: 0, facing: 0 }
/** The same blade speed share, sampled a few times a second for the UI. */
export const windRatio = shallowRef(0)
