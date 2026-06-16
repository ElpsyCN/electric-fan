<script setup lang="ts">
import { store } from '~/stores'
</script>

<template>
  <div id="fan">
    <div class="fan-header">
      <div :class="`leafs-${store.state.level}`">
        <div class="circle" />
        <div class="leaf-1" />
        <div class="leaf-2" />
        <div class="leaf-3" />
      </div>
    </div>
    <div class="fan-neck" />
    <div class="fan-footer" />
  </div>
  <FanSwitch />
</template>

<style lang="scss">
@use '~/styles/fan';
</style>
