import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily disable middleware completely for testing
  // Get the pathname of the request
  const path = req.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login'

  // Check for Supabase auth cookies
  const hasAuthCookie = req.cookies.has('sb-fuvtitcjzovzkknuuhcw-auth-token') || 
                       req.cookies.has('supabase-auth-token') ||
                       req.cookies.has('sb-auth-token')

  // If the path is public and user is authenticated, redirect to dashboard
  if (isPublicPath && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If the path is not public and user is not authenticated, redirect to login
  if (!isPublicPath && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 