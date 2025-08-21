import { getRequestConfig } from 'next-intl/server'

const locales = ['he']

export default getRequestConfig(async ({ locale }) => {
  // Only Hebrew is supported
  locale = 'he'

  return {
    locale,
    messages: (await import(`./messages/he.json`)).default
  }
})