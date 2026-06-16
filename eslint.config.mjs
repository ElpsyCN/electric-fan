import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      '.vite-ssg-dist',
      '.vite-ssg-temp',
      'src/auto-imports.d.ts',
      'src/components.d.ts',
    ],
  },
  {
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  },
)
