import { App } from "vue";
import { ElRadioGroup, ElRadio, ElRadioButton, ElButton } from "element-plus";
// import "element-plus/lib/theme-chalk/index.css";
import "element-theme-ink";

export const install = (app: App) => {
  app.use(ElButton);
  app.use(ElRadioGroup);
  app.use(ElRadio);
  app.use(ElRadioButton);
};
