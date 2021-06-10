import { registerSW } from "virtual:pwa-register";

export const install = () => {
  registerSW({ immediate: true });
};
