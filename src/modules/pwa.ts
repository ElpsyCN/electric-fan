// https://github.com/antfu/vite-plugin-pwa/issues/74#issuecomment-859413104
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });
