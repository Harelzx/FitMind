import createMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['he'],
  defaultLocale: 'he',
  localePrefix: 'never'
})

export default function middleware(request: NextRequest) {
  // For now, just apply internationalization middleware
  // Let the client-side auth handle route protection
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)']
}