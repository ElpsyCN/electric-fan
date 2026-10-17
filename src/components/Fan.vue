<script setup lang="ts">
import type { FanLevel } from '@yunlefun-home/electric-fan-core'
import { ElectricFan } from '@yunlefun-home/electric-fan'
import { store } from '~/stores'
import '@yunlefun-home/electric-fan/style.css'

const level = computed(() => store.state.level as FanLevel)
</script>

<template>
  <div id="fan">
    <ElectricFan :level="level" :oscillating="level > 0" title="电风扇" />
  </div>
  <FanSwitch />
</template>

<style lang="scss">
@use '~/styles/fan';

#fan {
  width: 240px;
  margin: 2rem auto;
}
</style>
