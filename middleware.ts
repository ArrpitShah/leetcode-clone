import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in — redirect to /auth (except /auth itself)
  if (!session && req.nextUrl.pathname !== '/auth') {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Already logged in — dont show auth page
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/problems/:path*', '/profile', '/admin', '/leaderboard']
}