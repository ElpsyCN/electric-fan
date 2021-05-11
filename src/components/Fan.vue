<template>
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
          >{{ item.name }}</el-radio-button
        >
      </el-radio-group>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      audioElm: "",
      stopFlag: false,
      switchItems: [
        { name: "关", class: "switch_0", value: 0 },
        { name: "1", class: "switch_1", value: 1 },
        { name: "2", class: "switch_2", value: 2 },
        { name: "3", class: "switch_3", value: 3 },
      ],
      leafs: "leafs",
      radio: 0,
      count: 0,
    };
  },
  beforeMount() {
    this.initAudioElm();
  },
  methods: {
    initAudioElm() {
      let audio = new Audio();
      audio.preload = "metadata";
      audio.src = "/audio/fan.wav";
      audio.load();
      this.audioElm = audio;
    },
    radioChange(val) {
      this.leafs = "leafs-" + val;
      this.count += 1;
      switch (val) {
        case 0:
          this.playSwitchAudio();
          break;
        default:
          this.stopFlag = false;
          if (
            this.audioElm.currentTime === 0 ||
            this.audioElm.currentTime === this.audioElm.duration
          ) {
            this.playFanAudio(0);
          } else {
            this.playFanAudio();
          }
          break;
      }
    },
    playSwitchAudio() {
      if (!this.audioElm.ended) {
        this.stopAudio();
      }
    },
    playFanAudio(currentTime = 3.5) {
      if (!this.stopFlag) {
        this.audioElm.currentTime = currentTime;
        this.audioElm.play();
        let _this = this;
        let delayTime = this.audioElm.duration - this.audioElm.currentTime - 1;
        setTimeout(function () {
          _this.playFanAudio();
        }, delayTime * 1000);
      }
    },
    stopAudio() {
      this.audioElm.currentTime = 6;
      this.stopFlag = true;
    },
  },
};
</script>

<style lang="scss" scoped>
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
$circle-position: $leaf-width/2 - ($circle-width/2 + $circle-border-width);

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
        left: $leaf-width/2;
        top: $leaf-width/2;
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
    left: $header-width/2 - $header-border-width - $neck-width/2;
    z-index: 2;
  }
  .footer {
    width: $footer-width;
    height: $footer-height;
    border-radius: 5%;
    background: $background-color;
    position: absolute;
    top: $header-width + $neck-height - 2px;
    left: $fan-width/2 - $header-border-width - $footer-width/2;
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
