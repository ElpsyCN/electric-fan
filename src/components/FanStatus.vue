<script setup lang="ts">
import type { FanLevel } from '@yunlefun-home/electric-fan/core'
import { fanSummary, fanTimerMinutesLeft } from '@yunlefun-home/electric-fan/core'
import { cancelRecording, isVoiceReady, operate, prepareVoice, startRecording, stopRecording, stopVoice, voiceLevel } from '~/composables'
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

// Talk into the fan, walkie-talkie style: hold to record, release to hear it
// played back through the blades.
type VoiceState = 'idle' | 'asking' | 'recording' | 'playing'
const voice = shallowRef<VoiceState>('idle')
const voiceTip = shallowRef('')
const micButton = useTemplateRef<HTMLButtonElement>('micButton')
const micLabel = computed(() => ({ idle: '按住说话', asking: '请允许麦克风', recording: '松开播放', playing: '播放中…' })[voice.value])
let levelFrame = 0
let pressedAt = 0
let held = false

function showLevel() {
  micButton.value?.style.setProperty('--voice', String(Math.round(voiceLevel() * 100) / 100))
  levelFrame = requestAnimationFrame(showLevel)
}

function hideLevel() {
  cancelAnimationFrame(levelFrame)
  micButton.value?.style.setProperty('--voice', '0')
}

async function pressVoice() {
  held = true
  voiceTip.value = ''
  if (voice.value === 'asking' || voice.value === 'recording')
    return
  if (!isVoiceReady()) {
    // The permission prompt takes the press; the next hold records.
    voice.value = 'asking'
    try {
      await prepareVoice()
      voice.value = 'idle'
      if (!held) {
        voiceTip.value = '麦克风已就绪，按住说话，松开播放'
        return
      }
    }
    catch {
      voice.value = 'idle'
      voiceTip.value = '没有拿到麦克风权限'
      return
    }
  }
  if (startRecording(releaseVoice)) {
    voice.value = 'recording'
    pressedAt = performance.now()
    showLevel()
  }
}

async function releaseVoice() {
  held = false
  if (voice.value !== 'recording')
    return
  if (performance.now() - pressedAt < 300) {
    cancelRecording()
    hideLevel()
    voice.value = 'idle'
    voiceTip.value = '要按住说话，松开后播放'
    return
  }
  voice.value = 'playing'
  if (windRatio.value < 0.03)
    voiceTip.value = '风扇没开，声音没被切碎：先按 1 / 2 / 3'
  try {
    await stopRecording()
  }
  finally {
    hideLevel()
    if (voice.value === 'playing')
      voice.value = 'idle'
  }
}

// Close the microphone when the page is hidden.
useEventListener(document, 'visibilitychange', () => {
  if (document.hidden) {
    stopVoice()
    hideLevel()
    voice.value = 'idle'
  }
})

onBeforeUnmount(() => {
  hideLevel()
  stopVoice()
})

// Keyboard: 0–3 speed, O 摇头, N 自然风, T 定时, hold V to talk.
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
  else if (key === 'v')
    void pressVoice()
})
useEventListener('keyup', (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'v')
    void releaseVoice()
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
    <button
      ref="micButton"
      class="mic"
      type="button"
      :aria-pressed="voice === 'recording'"
      :class="{ 'is-playing': voice === 'playing' }"
      title="对着风扇说话：开风扇后按住说「啊——」，松开播放（按住 V）"
      @pointerdown.prevent="pressVoice"
      @pointerup="releaseVoice"
      @pointercancel="releaseVoice"
      @pointerleave="releaseVoice"
      @keydown.space.enter.prevent="!$event.repeat && pressVoice()"
      @keyup.space.enter="releaseVoice"
      @contextmenu.prevent
    >
      <i-carbon-microphone v-if="voice === 'recording'" aria-hidden="true" />
      <i-carbon-volume-up v-else-if="voice === 'playing'" aria-hidden="true" />
      <i-carbon-microphone-off v-else aria-hidden="true" />
      {{ micLabel }}
    </button>
    <span v-if="voiceTip" class="status__tip" role="status">{{ voiceTip }}</span>
    <span v-if="remaining" class="status__timer">
      <i-carbon-timer aria-hidden="true" />
      <span class="sr-only">定时剩余</span>{{ remaining }}
    </span>
  </section>
</template>
