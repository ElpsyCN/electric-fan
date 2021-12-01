<template>
  <h3 class="pt-8 text-4xl" :title="description">
    {{ title }}
    <br />
    <small class="text-sm">
      {{ description }}
    </small>
  </h3>

  <BaseHeader class="mt-4" />
  <Fan />
  <BaseFooter />
</template>

<script setup lang="ts">
const title = '夏日清凉小风扇'
const description = '除了没有风，什么都好！'
</script>
