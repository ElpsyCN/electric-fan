<script setup lang="ts">
import { ref } from 'vue'
import { store } from '~/stores'

const stopFlag = ref(false)
const state = toRefs(store.state)

const switchItems = [
  { name: '关', class: 'switch_0', value: 0 },
  { name: '1', class: 'switch_1', value: 1 },
  { name: '2', class: 'switch_2', value: 2 },
  { name: '3', class: 'switch_3', value: 3 },
]

const audioEl = ref<HTMLAudioElement>()
const switchAudioEl = ref<HTMLAudioElement>()

function playAudio(audio: HTMLAudioElement) {
  void audio.play().catch(() => undefined)
}

function radioChange(level: number) {
  store.state.level = level

  switch (level) {
    case 0:
      stopAudio()
      break
    default:
      stopFlag.value = false
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

    audioEl.value.currentTime = currentTime
    playAudio(audioEl.value)
    const delayTime = audioEl.value.duration - audioEl.value.currentTime - 1
    setTimeout(() => {
      playFanAudio()
    }, delayTime * 1000)
  }
}
</script>

<template>
  <audio id="switch-audio" ref="switchAudioEl" src="/audio/switch.mp3" />
  <audio id="switch-audio" ref="audioEl" preload="metadata" src="/audio/fan.wav" />
  <button
    v-for="(item, index) in switchItems"
    :key="index"
    class="fan-btn"
    :class="[item.class, item.value === state.level.value ? 'is-active' : '']"
    :label="item.name"
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
