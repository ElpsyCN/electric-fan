import type { UserModule } from '~/types'
import { createI18n } from 'vue-i18n'

type MessageValue = string | { [key: string]: MessageValue }

interface MessageSchema {
  [key: string]: MessageValue
}

type AppLocale = 'en' | 'zh-CN'

// Import i18n resources
// https://vite.dev/guide/features.html#glob-import
const messages = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: MessageSchema }>('../../locales/*.{yml,yaml}', { eager: true }),
  ).map(([key, value]) => [
    key.replace('../../locales/', '').replace(/\.ya?ml$/, ''),
    value.default,
  ]),
) as Record<AppLocale, MessageSchema>

export const install: UserModule = ({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, AppLocale>({
    legacy: false,
    locale: 'en',
    messages,
  })

  app.use(i18n)
}
