<template>
  <div id="app">
    <h3 :title="description">
      {{ title }}
      <br />
      <small>
        {{ description }}
      </small>
    </h3>

    <fan></fan>

    <div class="footer">
      <div style="margin: 1rem">
        <el-button>
          <a :href="adImageLink" target="_blank"
            ><span class="animate-logo">{{ adText }}</span></a
          >
        </el-button>
      </div>
      <vue-about-me :copyright="copyright" :links="links"></vue-about-me>
    </div>
  </div>
</template>

<script lang="ts">
import Fan from "./components/Fan.vue";
import VueAboutMe from "vue-about-me/sfc";
import { defineComponent } from "@vue/runtime-core";

const adImageLink =
  "https://upyun.yunyoujun.cn/images/eat-watermelon-qrcode.jpg";

export default defineComponent({
  name: "app",
  data() {
    return {
      title: "夏日清凉小风扇",
      description: "除了没有风，什么都好！",
      copyright: {
        name: "Electric Fan",
        repo: "electric-fan",
        author: "YunYouJun",
        logo: "emojione:watermelon",
        link: adImageLink,
      },
      links: [
        {
          name: "github",
          color: "black",
          icon: "ri:github-line",
          label: `GitHub: YunYouJun`,
          href: `https://github.com/YunYouJun`,
        },
        {
          name: "telegram",
          color: "#1da1f2",
          icon: "ri:telegram-line",
          label: "Telegram Channel",
          href: "https://t.me/elpsycn",
        },
        {
          name: "weibo",
          color: "#DB2828",
          icon: "ri:weibo-line",
          label: "微博：机智的云游君",
          href: "http://weibo.com/jizhideyunyoujun",
        },
        {
          name: "blog",
          color: "#6435C9",
          icon: "ri:global-line",
          label: "博客：yunyoujun.cn",
          href: "http://www.yunyoujun.cn",
        },
        {
          name: "wechat",
          color: "#1AAD19",
          icon: "ri:wechat-2-line",
          label: "微信公众号：云游君",
          href:
            "https://cdn.jsdelivr.net/gh/YunYouJun/cdn/img/about/white-qrcode-and-search.jpg",
        },
        {
          name: "bilibili",
          color: "#FF8EB3",
          icon: "ri:bilibili-line",
          label: "哔哩哔哩：机智的云游君",
          href: "https://space.bilibili.com/1579790",
        },
      ],

      adText: "🍉",
      adImageLink,
    };
  },
  components: {
    Fan,
    VueAboutMe,
  },
});
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#app > .footer {
  margin-top: 460px;
}
</style>
