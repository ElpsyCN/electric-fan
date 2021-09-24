import VueGtag from 'vue-gtag'

import { UserModule } from '~/types'

// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = ({ isClient, app }) => {
  if (!isClient) { return }

  app.use(VueGtag, {
    config: {
      id: 'G-FMH4WDW53W',
    },
  })
}
