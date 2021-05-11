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
      <vue-about-me :copyright="copyright"></vue-about-me>
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
