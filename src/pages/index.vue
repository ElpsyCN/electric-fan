<script setup lang="ts">
import { windRatio } from '~/stores'

const title = '夏日清凉小风扇'
const description = '除了没有风，什么都好！'
</script>

<template>
  <div class="page" :style="{ '--wind': windRatio }">
    <TopBar />
    <h1 class="headline" :title="description">
      {{ title }}
      <small class="headline__sub">
        <span v-for="(char, index) in description" :key="index" :style="{ '--i': index }">{{ char }}</span>
      </small>
    </h1>

    <Fan />
    <FanStatus />
    <FanManual />
  </div>
</template>
