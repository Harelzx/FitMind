import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitMind - המסע שלך לירידה במשקל',
  description: 'עוזר אישי חכם לירידה במשקל עם תמיכת AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  )
}