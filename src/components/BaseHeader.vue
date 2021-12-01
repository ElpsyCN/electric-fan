<template>
  <button class="icon-btn mx-2 !outline-none" :title="t('button.toggle_dark')" @click="toggleDark()">
    <i-carbon-moon v-if="isDark" />
    <i-carbon-sun v-else />
  </button>
</template>

<script setup lang="ts">
import { isDark, toggleDark } from '~/composables'
const { t } = useI18n()
</script>
