import { createApp } from "vue";
import App from "./App.vue";
import VueGtag from "vue-gtag";

// pwa
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

const app = createApp(App);

// dynamic load modules
Object.values(import.meta.globEager("./modules/*.ts")).map((i) =>
  i.install?.(app)
);

app.use(VueGtag, {
  config: {
    id: "G-FMH4WDW53W",
  },
});

app.mount("#app");
