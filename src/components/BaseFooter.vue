<template>
  <div class="footer">
    <div style="margin: 1rem">
      <a :href="adsenseLink" target="_blank">
        <el-button>
          <span class="animate-logo">{{ adText }}</span>
        </el-button>
      </a>
    </div>
    <vue-about-me :copyright="copyright"></vue-about-me>
  </div>
</template>

<script lang="ts" setup>
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
