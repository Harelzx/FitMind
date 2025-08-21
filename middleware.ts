import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['he'],
  defaultLocale: 'he',
  localePrefix: 'never'
})

export default function middleware(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}