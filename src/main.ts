import type { UserModule } from './types'
import { setupLayouts } from 'virtual:generated-layouts'
import { ViteSSG } from 'vite-ssg'
import generatedRoutes from '~pages'
import App from './App.vue'

// your custom styles here
import './styles/vars.scss'
import './styles/main.scss'
import './styles/index.scss'

import 'virtual:uno.css'
import 'virtual:unocss-devtools'

const routes = setupLayouts(generatedRoutes)

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    // install all modules under `modules/`
    Object.values(import.meta.glob<{ install?: UserModule }>('./modules/*.ts', { eager: true }))
      .forEach(i => i.install?.(ctx))
  },
)
