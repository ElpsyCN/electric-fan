import { ElRadioGroup, ElRadio, ElRadioButton, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'
// import "element-theme-ink";

import { UserModule } from '~/types'

// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = ({ isClient, app }) => {
  if (!isClient) { return }

  app.use(ElButton)
  app.use(ElRadioGroup)
  app.use(ElRadio)
  app.use(ElRadioButton)
}
