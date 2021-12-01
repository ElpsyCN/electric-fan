<template>
  <div id="fan">
    <div class="fan-header">
      <div :class="'leafs-' + store.state.level">
        <div class="circle"></div>
        <div class="leaf-1"></div>
        <div class="leaf-2"></div>
        <div class="leaf-3"></div>
      </div>
    </div>
    <div class="fan-neck"></div>
    <div class="fan-footer"></div>
  </div>
  <FanSwitch />
</template>

<script setup lang="ts">
import { store } from '~/stores'
</script>

<style lang="scss">
@import '~/styles/fan.scss';
</style>
