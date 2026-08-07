import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const DASHBOARD_PREFIX = '/dashboard'
// Only "My Appointments" and "Support" need a client session — the
// magic-link booking page (/portal/[appointmentId]) and the client
// login/signup pages must stay public, so we can't just match the whole
// /portal prefix (that was the previous bug: it silently redirected the
// booking-confirmation email link to the *business* /login page).
const PROTECTED_PORTAL_PATHS = ['/portal', '/portal/support']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboardProtected = path.startsWith(DASHBOARD_PREFIX)
  const isPortalProtected = PROTECTED_PORTAL_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

  if (!user && (isDashboardProtected || isPortalProtected)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = isPortalProtected ? '/portal/login' : '/login'
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
