<template>
  <audio id="switch-audio" src="/audio/switch.mp3"></audio>
  <div id="fan">
    <div class="header">
      <div :key="count" :class="leafs">
        <div class="circle"></div>
        <div class="leaf-1"></div>
        <div class="leaf-2"></div>
        <div class="leaf-3"></div>
      </div>
    </div>
    <div class="neck"></div>
    <div class="footer"></div>

    <div class="switch-btn-group">
      <el-radio-group v-model="radio" @change="radioChange">
        <el-radio-button
          v-for="(item, index) in switchItems"
          :key="index"
          :class="item.class"
          v-model="item.value"
          :label="item.value"
          @click="
            () => {
              playSwitchAudio();
            }
          "
          >{{ item.name }}</el-radio-button
        >
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";

const switchItems = [
  { name: "关", class: "switch_0", value: 0 },
  { name: "1", class: "switch_1", value: 1 },
  { name: "2", class: "switch_2", value: 2 },
  { name: "3", class: "switch_3", value: 3 },
];

const radio = ref(0);

const leafs = ref("leafs");
const count = ref(0);
const stopFlag = ref(false);
const audioElm = ref<HTMLAudioElement | null>(null);

function initAudioElm() {
  let audio = new Audio();
  audio.preload = "metadata";
  audio.src = "/audio/fan.wav";
  audio.load();
  audioElm.value = audio;
}

/**
 * 停止声音
 */
function stopAudio() {
  if (audioElm.value) {
    audioElm.value.currentTime = 6;
  }
  stopFlag.value = true;
}

/**
 * 播放风扇音频
 */
function playFanAudio(currentTime = 3.5) {
  if (!stopFlag.value) {
    if (!audioElm.value) {
      return;
    }

    audioElm.value.currentTime = currentTime;
    audioElm.value.play();
    let delayTime = audioElm.value.duration - audioElm.value.currentTime - 1;
    setTimeout(function () {
      playFanAudio();
    }, delayTime * 1000);
  }
}

function radioChange(val: number) {
  leafs.value = "leafs-" + val;
  count.value += 1;
  switch (val) {
    case 0:
      stopAudio();
      break;
    default:
      stopFlag.value = false;
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
    "#switch-audio"
  ) as HTMLAudioElement;
  switchAudio.play();
}

onBeforeMount(() => {
  initAudioElm();
});
</script>

<style lang="scss">
@use "sass:math";
$background-color: #000;
$border-color: #000;

$fan-width: 220px;

$header-width: 220px;
$header-border-width: 10px;

$leaf-border-width: 8px;
$leaf-width: 200px;

$neck-width: 10px;
$neck-height: 60px;

$footer-height: 10px;
$footer-width: 150px;

$circle-width: 15px;
$circle-border-width: 8px;
$circle-position: math.div($leaf-width, 2) -
  (math.div($circle-width, 2) + $circle-border-width);

@keyframes leafsRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1080deg);
  }
}

#fan {
  width: $fan-width;
  margin: 50px auto;
  position: relative;
  z-index: 4;
  .header {
    width: $header-width;
    height: $header-width;
    position: absolute;
    left: -2 * $header-border-width;
    top: -2 * $header-border-width;
    border-radius: 50%;
    z-index: 1;
    border: solid $header-border-width $border-color;

    .leafs {
      z-index: 2;
      position: absolute;
      animation: leafsRotate 0s infinite linear;
      transform-origin: center center;
      width: $leaf-width;
      height: $leaf-width;
      top: $header-border-width;
      left: $header-border-width;
      .circle {
        width: $circle-width;
        height: $circle-width;
        border: solid $circle-border-width $border-color;
        border-radius: 50%;
        position: absolute;
        left: $circle-position;
        top: $circle-position;
      }
      .leaf {
        width: 72px;
        height: 60px;
        border-radius: 20% 50%;
        border: $leaf-border-width solid $border-color;
        position: absolute;
        left: math.div($leaf-width, 2);
        top: math.div($leaf-width, 2);
        transform-origin: 0% 0%;
      }
      .leaf-1 {
        @extend .leaf;
      }
      .leaf-2 {
        @extend .leaf;
        transform: rotate(120deg);
      }
      .leaf-3 {
        @extend .leaf;
        transform: rotate(240deg);
      }
    }

    .leafs-0 {
      @extend .leafs;
      animation-duration: 3s;
      animation-timing-function: ease-out;
      animation-delay: 0s;
      animation-iteration-count: 1;
      animation-fill-mode: forwards;
    }
    .leafs-1 {
      @extend .leafs;
      animation-duration: 2s;
    }
    .leafs-2 {
      @extend .leafs;
      animation-duration: 1.5s;
    }
    .leafs-3 {
      @extend .leafs;
      animation-duration: 0.8s;
    }
  }
  .neck {
    width: $neck-width;
    height: $neck-height;
    background: $background-color;
    position: absolute;
    top: $header-width - 1;
    left: math.div($header-width, 2) - $header-border-width -
      math.div($neck-width, 2);
    z-index: 2;
  }
  .footer {
    width: $footer-width;
    height: $footer-height;
    border-radius: 5%;
    background: $background-color;
    position: absolute;
    top: $header-width + $neck-height - 2px;
    left: math.div($fan-width, 2) - $header-border-width -
      math.div($footer-width, 2);
    z-index: 3;
  }

  .switch-btn-group {
    position: absolute;
    top: $header-width + $neck-height + $footer-height + 50px;
    text-align: center;
  }
  .radio {
    display: inline-block;
    width: 50px;
  }
  .label {
    margin-top: 10px;
  }
}
</style>
