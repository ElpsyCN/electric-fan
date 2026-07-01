<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'
import { store } from '~/stores'

const stopFlag = shallowRef(false)
const state = toRefs(store.state)

const switchItems = [
  { name: '关', ariaLabel: '关闭风扇', class: 'switch_0', value: 0 },
  { name: '1', ariaLabel: '切换到一档风', class: 'switch_1', value: 1 },
  { name: '2', ariaLabel: '切换到二档风', class: 'switch_2', value: 2 },
  { name: '3', ariaLabel: '切换到三档风', class: 'switch_3', value: 3 },
]

const audioEl = useTemplateRef<HTMLAudioElement>('fanAudio')
const switchAudioEl = useTemplateRef<HTMLAudioElement>('switchAudio')
let fanAudioTimer: ReturnType<typeof setTimeout> | undefined

function playAudio(audio: HTMLAudioElement) {
  void audio.play().catch(() => undefined)
}

function clearFanAudioTimer() {
  if (fanAudioTimer) {
    clearTimeout(fanAudioTimer)
    fanAudioTimer = undefined
  }
}

function radioChange(level: number) {
  store.state.level = level

  switch (level) {
    case 0:
      stopAudio()
      break
    default:
      stopFlag.value = false
      clearFanAudioTimer()
      if (!audioEl.value) {
        return
      }
      if (
        audioEl.value.currentTime === 0
        || audioEl.value.currentTime === audioEl.value.duration
      ) {
        playFanAudio(0)
      }
      else {
        playFanAudio()
      }
      break
  }
}

/**
 * 播放切换开关音效
 */
function playSwitchAudio() {
  if (switchAudioEl.value)
    playAudio(switchAudioEl.value)
}

/**
 * 停止声音
 */
function stopAudio() {
  clearFanAudioTimer()
  if (audioEl.value) {
    audioEl.value.currentTime = 6
  }
  stopFlag.value = true
}

/**
 * 播放风扇音频
 */
function playFanAudio(currentTime = 3.5) {
  if (!stopFlag.value) {
    if (!audioEl.value) {
      return
    }

    const audio = audioEl.value
    if (audio.readyState > HTMLMediaElement.HAVE_NOTHING && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(currentTime, Math.max(audio.duration - 0.1, 0))
    }

    playAudio(audio)
    const delayTime = Number.isFinite(audio.duration)
      ? Math.max(audio.duration - audio.currentTime - 1, 0.25)
      : 0.25
    fanAudioTimer = setTimeout(() => {
      playFanAudio()
    }, delayTime * 1000)
  }
}
</script>

<template>
  <audio id="switch-audio" ref="switchAudio" preload="none" src="/audio/switch.mp3" />
  <audio id="fan-audio" ref="fanAudio" preload="none">
    <source src="/audio/fan.mp3" type="audio/mpeg">
    <source src="/audio/fan.wav" type="audio/wav">
  </audio>
  <button
    v-for="(item, index) in switchItems"
    :key="index"
    class="fan-btn"
    :class="[item.class, item.value === state.level.value ? 'is-active' : '']"
    :aria-label="item.ariaLabel"
    :aria-pressed="item.value === state.level.value"
    type="button"
    @click="
      () => {
        radioChange(item.value);
        playSwitchAudio();
      }
    "
  >
    {{ item.name }}
  </button>
</template>
