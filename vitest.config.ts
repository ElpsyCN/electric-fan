import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@yunlefun-home/electric-fan/core': fileURLToPath(new URL('./packages/electric-fan/src/core/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/test/**/*.test.ts'],
  },
})
