<template>
  <div id="fan">
    <div class="header">
      <div :class="'leafs-' + store.state.level">
        <div class="circle"></div>
        <div class="leaf-1"></div>
        <div class="leaf-2"></div>
        <div class="leaf-3"></div>
      </div>
    </div>
    <div class="neck"></div>
    <div class="footer"></div>
  </div>
  <FanSwitch></FanSwitch>
</template>

<script setup lang="ts">
import { store } from "~/store";
import FanSwitch from "~/components/FanSwitch.vue";
</script>

<style lang="scss">
@use "sass:math";
$background-color: #000;
$border-color: #000;

$fan-width: 220px;

$header-width: $fan-width;
$header-border-width: 10px;

$leaf-border-width: 8px;
$leaf-width: 200px;

$neck-width: 10px;
$neck-height: 60px;

$footer-height: 10px;
$footer-width: 150px;

$circle-width: 10px;
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
  height: $header-width + $neck-height + $footer-height;
  margin: 50px auto;
  position: relative;
  z-index: 4;
  .header {
    width: $header-width;
    height: $header-width;
    position: absolute;
    left: -$header-border-width;
    top: -$header-border-width;
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
    top: $header-width + 8px;
    left: math.div($header-width, 2) -
      math.div($neck-width, 2);
    z-index: 2;
  }

  .footer {
    width: $footer-width;
    height: $footer-height;
    border-radius: 5%;
    background: $background-color;
    position: absolute;
    top: $header-width + $neck-height + 8px;
    left: math.div($fan-width, 2) -
      math.div($footer-width, 2);
    z-index: 3;
  }
}
</style>
