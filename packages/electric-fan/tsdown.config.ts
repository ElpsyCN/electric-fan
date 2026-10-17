import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

// Two entries: `.` (the Vue component, re-exporting the core) and `./core`,
// which never imports Vue so non-Vue hosts can use the state machine alone.
export default defineConfig({
  entry: { index: 'src/index.ts', core: 'src/core/index.ts' },
  format: ['esm', 'cjs'],
  dts: { vue: true },
  clean: true,
  platform: 'neutral',
  plugins: [Vue({ isProduction: true })],
  deps: {
    neverBundle: ['vue'],
  },
})
