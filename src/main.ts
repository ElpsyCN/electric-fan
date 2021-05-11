import { createApp } from "vue";
import App from "./App.vue";

import { ElRadioGroup, ElRadio, ElRadioButton } from "element-plus";
import "element-plus/lib/theme-chalk/index.css";

const app = createApp(App);
app.use(ElRadioGroup);
app.use(ElRadio);
app.use(ElRadioButton);
app.mount("#app");
