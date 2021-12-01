<template>
  <div class="footer">
    <div style="margin: 1rem">
      <a :href="adsenseLink" target="_blank">
        <button class="fan-btn">
          <span class="animate-logo">{{ adText }}</span>
        </button>
      </a>
    </div>
    <vue-about-me :is-dark="isDark" :copyright="copyright"></vue-about-me>
  </div>
</template>

<script lang="ts" setup>
import { isDark } from '~/composables'

import VueAboutMe from 'vue-about-me'
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
