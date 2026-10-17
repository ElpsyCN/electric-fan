<script setup lang="ts">
/**
 * Line-art electric fan: guard with grille, three petal blades, neck and base.
 * Blades spin with the Web Animations API so speed changes ease smoothly and
 * turning off lets them coast to a stop. Theme with `--fan-color` and
 * `--fan-bg-color` on any ancestor.
 *
 * @example
 * ```vue
 * <ElectricFan :level="2" oscillating title="电风扇" />
 * ```
 */
import type { FanLevel } from './core'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { fanSpinSeconds } from './core'

const props = withDefaults(defineProps<{
  /** 0 = off, 1–3 = speed */
  level?: FanLevel
  /** Sway the head while running */
  oscillating?: boolean
  /** Accessible title; decorative when empty */
  title?: string
}>(), {
  level: 0,
  oscillating: false,
  title: '',
})

const CENTER = 120
// Each blade is a petal on its own radius, from under the hub to inside the guard.
const BLADE_PATH = 'M0 -10C16 -10 29 -23 29 -39C29 -67.2 16 -90 0 -90C-16 -90 -29 -67.2 -29 -39C-29 -23 -16 -10 0 -10Z'
const BLADE_ANGLES = [0, 120, 240]
const spokes = Array.from({ length: 26 }, (_, index) => {
  const angle = (index * 2 * Math.PI) / 26
  const round = (value: number) => Math.round(value * 100) / 100
  return {
    x1: round(CENTER + Math.sin(angle) * 22),
    y1: round(CENTER - Math.cos(angle) * 22),
    x2: round(CENTER + Math.sin(angle) * 109),
    y2: round(CENTER - Math.cos(angle) * 109),
  }
})

const running = computed(() => props.level > 0)
const blades = useTemplateRef<SVGGElement>('blades')
let spin: Animation | undefined
let rampFrame = 0

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Ease the playback rate toward the target so the blades never jump.
function rampTo(target: number, duration: number) {
  if (!spin)
    return
  cancelAnimationFrame(rampFrame)
  const from = spin.playbackRate
  const started = performance.now()
  const step = (now: number) => {
    if (!spin)
      return
    const progress = Math.min(1, (now - started) / duration)
    const eased = 1 - (1 - progress) ** 3
    spin.updatePlaybackRate(from + (target - from) * eased)
    if (progress < 1)
      rampFrame = requestAnimationFrame(step)
  }
  rampFrame = requestAnimationFrame(step)
}

function applyLevel(level: FanLevel) {
  if (!spin || prefersReducedMotion())
    return
  if (level > 0 && spin.playState !== 'running')
    spin.play()
  // Start up quickly, coast down slowly, as a real motor does.
  rampTo(level === 0 ? 0 : 1 / fanSpinSeconds[level], level === 0 ? fanSpinSeconds[0] * 1000 : 900)
}

onMounted(() => {
  if (!blades.value || typeof blades.value.animate !== 'function')
    return
  spin = blades.value.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1000, iterations: Infinity })
  spin.updatePlaybackRate(0)
  if (props.level > 0 && !prefersReducedMotion())
    spin.updatePlaybackRate(1 / fanSpinSeconds[props.level])
})

watch(() => props.level, applyLevel)

onBeforeUnmount(() => {
  cancelAnimationFrame(rampFrame)
  spin?.cancel()
  spin = undefined
})
</script>

<template>
  <svg
    class="electric-fan"
    :class="{ 'is-running': running, 'is-oscillating': running && oscillating }"
    viewBox="0 0 240 312"
    role="img"
    focusable="false"
    :aria-hidden="title ? undefined : 'true'"
  >
    <title v-if="title">{{ title }}</title>
    <ellipse class="electric-fan__shadow" cx="120" cy="306" rx="84" ry="6" />
    <rect class="electric-fan__base" x="45" y="296" width="150" height="10" rx="3" />
    <rect class="electric-fan__neck" x="115" y="236" width="10" height="62" />
    <g class="electric-fan__head">
      <circle class="electric-fan__face" :cx="CENTER" :cy="CENTER" r="110" />
      <g class="electric-fan__grille">
        <circle :cx="CENTER" :cy="CENTER" r="33" />
        <circle :cx="CENTER" :cy="CENTER" r="63" />
        <circle :cx="CENTER" :cy="CENTER" r="94" />
        <line v-for="(spoke, index) in spokes" :key="index" v-bind="spoke" />
      </g>
      <g ref="blades" class="electric-fan__blades">
        <path
          v-for="angle in BLADE_ANGLES" :key="angle" class="electric-fan__blade" :d="BLADE_PATH"
          :transform="`translate(${CENTER} ${CENTER}) rotate(${angle}) skewX(-8)`"
        />
      </g>
      <circle class="electric-fan__hub" :cx="CENTER" :cy="CENTER" r="17" />
      <circle class="electric-fan__ring" :cx="CENTER" :cy="CENTER" r="115" />
    </g>
  </svg>
</template>
