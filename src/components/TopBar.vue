<script setup lang="ts">
import { isDark, setAudioMuted, unlockAudio } from '~/composables'
import { muted, view } from '~/stores'

const toggleDark = useToggle(isDark)

function toggleMuted() {
  muted.value = !muted.value
  if (!muted.value)
    void unlockAudio()
}

watch(muted, setAudioMuted, { immediate: true })

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
    return
  if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]'))
    return
  const key = event.key.toLowerCase()
  if (key === 'v')
    view.value = view.value === '3d' ? '2d' : '3d'
  else if (key === 'm')
    toggleMuted()
})
</script>

<template>
  <header class="topbar">
    <div class="segmented" role="radiogroup" aria-label="视图（V）">
      <span class="segmented__thumb" :class="{ 'is-right': view === '3d' }" aria-hidden="true" />
      <button type="button" role="radio" :aria-checked="view === '2d'" @click="view = '2d'">
        2D
      </button>
      <button type="button" role="radio" :aria-checked="view === '3d'" @click="view = '3d'">
        3D
      </button>
    </div>
    <div class="topbar__actions">
      <button class="icon-toggle" type="button" :aria-pressed="!muted" :title="muted ? '打开声音（M）' : '静音（M）'" :aria-label="muted ? '打开声音' : '静音'" @click="toggleMuted">
        <i-carbon-volume-mute v-if="muted" />
        <i-carbon-volume-up v-else />
      </button>
      <button class="icon-toggle" type="button" :title="isDark ? '浅色模式' : '深色模式'" :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'" @click="toggleDark()">
        <i-carbon-moon v-if="isDark" />
        <i-carbon-sun v-else />
      </button>
      <a class="icon-toggle" href="https://github.com/ElpsyCN/electric-fan" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
        <i-carbon-logo-github />
      </a>
    </div>
  </header>
</template>
