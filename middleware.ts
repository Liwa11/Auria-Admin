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

  // Verwijder alle login checks en redirects

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