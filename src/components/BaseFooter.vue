<script lang="ts" setup>
import { VueAboutMe } from 'vue-about-me'

import { isDark } from '~/composables'
import 'vue-about-me/style.css'

const adsenseLink = 'https://sponsors.yunyoujun.cn'
const adText = '💰'

const copyright = {
  name: 'Electric Fan',
  repo: 'electric-fan',
  author: 'YunYouJun',
  logo: 'emojione:watermelon',
  link: adsenseLink,
}
</script>

<template>
  <div class="footer">
    <div style="margin: 1rem">
      <a class="fan-btn fan-sponsor" :href="adsenseLink" target="_blank" rel="noopener noreferrer" aria-label="赞助项目">
        <span class="animate-logo">{{ adText }}</span>
      </a>
    </div>
    <VueAboutMe :is-dark="isDark" :copyright="copyright" />
  </div>
</template>
