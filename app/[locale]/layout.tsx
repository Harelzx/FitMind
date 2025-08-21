import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Heebo } from 'next/font/google'

const heebo = Heebo({ 
  subsets: ['hebrew'],
  variable: '--font-heebo',
})

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={heebo.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}