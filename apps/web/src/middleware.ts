export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /api/auth (NextAuth routes)
     * - /login, /register (public auth pages)
     * - /_next (Next.js internals)
     * - /favicon.ico, static files
     */
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)',
  ],
}
