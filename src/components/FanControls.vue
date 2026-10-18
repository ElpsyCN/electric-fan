<script setup lang="ts">
import type { FanAction, FanLevel } from '@yunlefun-home/electric-fan/core'
import { fanSummary } from '@yunlefun-home/electric-fan/core'
import { playClick, unlockAudio } from '~/composables'
import { cycleTimer, dispatch, expireTimer, fanState, level, windRatio } from '~/stores'

const keys: { level: FanLevel, label: string, ariaLabel: string }[] = [
  { level: 0, label: '关', ariaLabel: '关闭风扇' },
  { level: 1, label: '1', ariaLabel: '一档风' },
  { level: 2, label: '2', ariaLabel: '二档风' },
  { level: 3, label: '3', ariaLabel: '三档风' },
]
const METER_BARS = 12

const now = shallowRef(Date.now())
const remaining = computed(() => {
  const { autoOffAt } = fanState.value
  if (!autoOffAt)
    return ''
  const seconds = Math.max(0, Math.ceil((Date.parse(autoOffAt) - now.value) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})

useIntervalFn(() => {
  now.value = Date.now()
  expireTimer()
}, 1000)

function press(action: FanAction | (() => void)) {
  void unlockAudio()
  playClick()
  if (typeof action === 'function')
    action()
  else
    dispatch(action)
}

function setLevel(value: FanLevel) {
  press({ type: 'set-level', level: value })
}

function toggleOscillation() {
  press({ type: 'toggle-oscillation' })
}

function toggleNatural() {
  press({ type: 'toggle-natural' })
}

function nextTimer() {
  press(() => {
    cycleTimer()
    now.value = Date.now()
  })
}

// Keyboard: 0–3 speed, O 摇头, N 自然风, T 定时.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
    return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable]'))
    return
  const key = event.key.toLowerCase()
  if (['0', '1', '2', '3'].includes(key))
    setLevel(Number(key) as FanLevel)
  else if (key === 'o')
    toggleOscillation()
  else if (key === 'n')
    toggleNatural()
  else if (key === 't')
    nextTimer()
})
</script>

<template>
  <section class="console" aria-label="风扇控制">
    <div class="console__keys" role="group" aria-label="风速">
      <button
        v-for="key in keys"
        :key="key.level"
        class="fan-btn"
        :class="{ 'is-active': key.level === level }"
        :aria-label="key.ariaLabel"
        :aria-pressed="key.level === level"
        :title="`${key.ariaLabel}（${key.level}）`"
        type="button"
        @click="setLevel(key.level)"
      >
        {{ key.label }}
      </button>
    </div>

    <div class="console__chips">
      <button class="chip" type="button" :aria-pressed="fanState.oscillating" title="摇头（O）" @click="toggleOscillation">
        <i-carbon-arrows-horizontal aria-hidden="true" />
        摇头
      </button>
      <button class="chip" type="button" :aria-pressed="fanState.natural" title="自然风（N）" @click="toggleNatural">
        <i-carbon-windy aria-hidden="true" />
        自然风
      </button>
      <button class="chip" type="button" :aria-pressed="!!fanState.autoOffAt" title="定时关闭：30 分钟 / 1 小时 / 2 小时（T）" @click="nextTimer">
        <i-carbon-timer aria-hidden="true" />
        <span class="chip__value">{{ remaining || '定时' }}</span>
      </button>
    </div>

    <div class="console__status" aria-live="polite">
      <span class="console__summary">{{ fanSummary(fanState) }}</span>
      <span class="meter" role="meter" aria-label="风力" :aria-valuenow="Math.round(windRatio * 100)" aria-valuemin="0" aria-valuemax="100">
        <span
          v-for="index in METER_BARS"
          :key="index"
          class="meter__bar"
          :class="{ 'is-lit': windRatio * METER_BARS >= index - 0.5 }"
          :style="{ height: `${30 + index * 70 / METER_BARS}%` }"
        />
      </span>
    </div>
  </section>
</template>
