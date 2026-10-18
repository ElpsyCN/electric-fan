<script setup lang="ts">
import type { FanLevel } from '@yunlefun-home/electric-fan/core'
import { fanSummary, fanTimerMinutesLeft } from '@yunlefun-home/electric-fan/core'
import { operate } from '~/composables'
import { expireTimer, fanState, windRatio } from '~/stores'

const METER_BARS = 12

const now = shallowRef(Date.now())
const remaining = computed(() => {
  const left = fanTimerMinutesLeft(fanState.value, now.value)
  if (left === null)
    return ''
  const seconds = Math.ceil(left * 60)
  const pad = (value: number) => String(value).padStart(2, '0')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(seconds % 60)}` : `${pad(m)}:${pad(seconds % 60)}`
})

useIntervalFn(() => {
  now.value = Date.now()
  expireTimer()
}, 1000)
watch(() => fanState.value.autoOffAt, () => now.value = Date.now())

// Keyboard: 0–3 speed, O 摇头, N 自然风, T 定时.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
    return
  if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]'))
    return
  const key = event.key.toLowerCase()
  if (['0', '1', '2', '3'].includes(key))
    operate({ type: 'set-level', level: Number(key) as FanLevel })
  else if (key === 'o')
    operate({ type: 'toggle-oscillation' })
  else if (key === 'n')
    operate({ type: 'toggle-natural' })
  else if (key === 't')
    operate('cycle-timer')
})
</script>

<template>
  <section class="status" aria-live="polite">
    <span class="status__summary">{{ fanSummary(fanState) }}</span>
    <span class="meter" role="meter" aria-label="风力" :aria-valuenow="Math.round(windRatio * 100)" aria-valuemin="0" aria-valuemax="100">
      <span
        v-for="index in METER_BARS"
        :key="index"
        class="meter__bar"
        :class="{ 'is-lit': windRatio * METER_BARS >= index - 0.5 }"
        :style="{ height: `${30 + index * 70 / METER_BARS}%` }"
      />
    </span>
    <span v-if="remaining" class="status__timer">
      <i-carbon-timer aria-hidden="true" />
      <span class="sr-only">定时剩余</span>{{ remaining }}
    </span>
  </section>
</template>
