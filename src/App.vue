<template>
  <div id="app">
    <h3 :title="description">{{ title }}</h3>

    <fan></fan>

    <div class="footer">
      <vue-about-me :copyright="copyright"></vue-about-me>
    </div>
  </div>
</template>

<script lang="ts">
import Fan from "./components/Fan.vue";
import VueAboutMe from "vue-about-me/sfc";
import { defineComponent } from "@vue/runtime-core";

export default defineComponent({
  name: "app",
  data() {
    return {
      title: "夏日清凉小风扇~",
      description: "除了没有风，什么都好！",
      copyright: {
        name: "Electric Fan",
        repo: "electric-fan",
        author: "YunYouJun",
        logo: "ri:cloud-line",
        link: "https://fan.elpsy.cn/",
      },
    };
  },
  components: {
    Fan,
    VueAboutMe,
  },
});
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#app > .footer {
  margin-top: 500px;
}
</style>
