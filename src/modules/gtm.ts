import { App } from "vue";
import { createGtm } from "@gtm-support/vue-gtm";

export const install = (app: App) => {
  app.use(
    createGtm({
      id: "GTM-NMD3456",
    })
  );
};
