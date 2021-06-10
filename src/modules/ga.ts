import { App } from "vue";
import VueGtag from "vue-gtag";

export const install = (app: App) => {
  app.use(VueGtag, {
    config: {
      id: "G-FMH4WDW53W",
    },
  });
};
