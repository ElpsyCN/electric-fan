import { defineConfig, presetAttributify, presetTypography, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  safelist: ['prose', 'prose-sm', 'm-auto', 'text-left'],
  presets: [
    presetWind3({
      dark: 'class',
    }),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        'a': {
          color: 'inherit',
          opacity: '0.75',
          fontWeight: '500',
          textDecoration: 'underline',
        },
        'a:hover': {
          opacity: '1',
          color: '#0d9488',
        },
        'b': { color: 'inherit' },
        'strong': { color: 'inherit' },
        'em': { color: 'inherit' },
        'h1': { color: 'inherit' },
        'h2': { color: 'inherit' },
        'h3': { color: 'inherit' },
        'h4': { color: 'inherit' },
        'code': { color: 'inherit' },
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
})
