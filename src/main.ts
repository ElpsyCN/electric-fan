import { createApp } from "vue";
import App from "./App.vue";
import VueGtag from "vue-gtag";

import { ElRadioGroup, ElRadio, ElRadioButton, ElButton } from "element-plus";
// import "element-plus/lib/theme-chalk/index.css";
import "element-theme-ink";

const app = createApp(App);
app.use(VueGtag, {
  config: {
    id: "G-FMH4WDW53W",
  },
});
app.use(ElButton);
app.use(ElRadioGroup);
app.use(ElRadio);
app.use(ElRadioButton);
app.mount("#app");
