import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // We can't set cookies directly on the request object,
            // so we'll let the response handle it
          },
          remove(name: string, options: CookieOptions) {
            // We can't remove cookies directly on the request object,
            // so we'll let the response handle it
          },
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (!authError && authData.user) {
      // Create response to set cookies properly
      const response = NextResponse.redirect(`${origin}${next}`)
      
      // Set auth cookies for session persistence
      if (authData.session) {
        response.cookies.set('fitmind-auth-token', authData.session.access_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        })
        
        response.cookies.set('fitmind-refresh-token', authData.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/'
        })
      }

      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', authData.user.id)
        .single()

      // If no profile exists, redirect to complete-profile
      if (!existingProfile) {
        // Create basic profile with Google user metadata
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'משתמש',
          })

        if (profileError) {
          console.error('Failed to create basic profile:', profileError)
        }

        response.headers.set('Location', `${origin}/complete-profile`)
        return response
      }

      // User has complete profile, redirect to dashboard
      return response
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}