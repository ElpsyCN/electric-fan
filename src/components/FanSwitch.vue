<template>
  <audio id="switch-audio" src="/audio/switch.mp3"></audio>
  <el-radio-group v-model="store.state.level" @change="radioChange">
    <el-radio-button
      v-for="(item, index) in switchItems"
      :key="index"
      v-model="item.value"
      :class="item.class"
      :label="item.value"
      @click="
        () => {
          playSwitchAudio();
        }
      "
    >
      {{ item.name }}
    </el-radio-button>
  </el-radio-group>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { store } from "~/store";

let stopFlag = false;

const switchItems = [
  { name: "关", class: "switch_0", value: 0 },
  { name: "1", class: "switch_1", value: 1 },
  { name: "2", class: "switch_2", value: 2 },
  { name: "3", class: "switch_3", value: 3 },
];

const audioElm = ref<HTMLAudioElement | null>(null);

function initAudioElm() {
  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = "/audio/fan.wav";
  audio.load();
  audioElm.value = audio;
}

onBeforeMount(() => {
  initAudioElm();
});

function radioChange(val: number) {
  switch (val) {
    case 0:
      stopAudio();
      break;
    default:
      stopFlag = false;
      if (!audioElm.value) {
        return;
      }
      if (
        audioElm.value.currentTime === 0 ||
        audioElm.value.currentTime === audioElm.value.duration
      ) {
        playFanAudio(0);
      } else {
        playFanAudio();
      }
      break;
  }
}

/**
 * 播放切换开关音效
 */
function playSwitchAudio() {
  const switchAudio = document.querySelector(
    "#switch-audio",
  ) as HTMLAudioElement;
  switchAudio.play();
}

/**
 * 停止声音
 */
function stopAudio() {
  if (audioElm.value) {
    audioElm.value.currentTime = 6;
  }
  stopFlag = true;
}

/**
 * 播放风扇音频
 */
function playFanAudio(currentTime = 3.5) {
  if (!stopFlag) {
    if (!audioElm.value) {
      return;
    }

    audioElm.value.currentTime = currentTime;
    audioElm.value.play();
    const delayTime = audioElm.value.duration - audioElm.value.currentTime - 1;
    setTimeout(function() {
      playFanAudio();
    }, delayTime * 1000);
  }
}
</script>
