import { createApp } from "vue";
import App from "./App.vue";
import "./styles/index.scss";

const app = createApp(App);

// dynamic load modules
Object.values(import.meta.globEager("./modules/*.ts")).map((i) =>
  i.install?.(app),
);

app.mount("#app");
