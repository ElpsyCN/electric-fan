import type { UserModule } from '~/types'
import { createGtm } from '@gtm-support/vue-gtm'

// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = ({ isClient, app }) => {
  if (!isClient)
    return

  app.use(
    createGtm({
      id: 'GTM-NMD3456',
    }),
  )
}
