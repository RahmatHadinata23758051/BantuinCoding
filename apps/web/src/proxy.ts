import { auth } from '@/lib/auth'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Define routes that do not require authentication
const publicPages = ['/', '/login', '/register']

export default auth((req) => {
  const isAuth = !!req.auth
  const pathname = req.nextUrl.pathname

  // Check if the path matches any public page (with or without locale prefix)
  const isPublicPage = publicPages.some((page) =>
    pathname === page ||
    pathname === `/${routing.defaultLocale}${page === '/' ? '' : page}` ||
    routing.locales.some((l) => pathname === `/${l}${page === '/' ? '' : page}`)
  )

  // Redirect unauthenticated users trying to access protected routes
  if (!isAuth && !isPublicPage) {
    const locale = pathname.split('/')[1]
    const activeLocale = routing.locales.includes(locale as typeof routing.locales[number])
      ? locale
      : routing.defaultLocale

    // Redirect to login preserving the locale
    const loginUrl = new URL(
      activeLocale === routing.defaultLocale && routing.localePrefix === 'as-needed'
        ? '/login'
        : `/${activeLocale}/login`,
      req.nextUrl
    )
    return Response.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages to the dashboard
  if (isAuth && isPublicPage && (pathname.endsWith('/login') || pathname.endsWith('/register'))) {
    const locale = pathname.split('/')[1]
    const activeLocale = routing.locales.includes(locale as typeof routing.locales[number])
      ? locale
      : routing.defaultLocale

    const dashboardUrl = new URL(
      activeLocale === routing.defaultLocale && routing.localePrefix === 'as-needed'
        ? '/dashboard'
        : `/${activeLocale}/dashboard`,
      req.nextUrl
    )
    return Response.redirect(dashboardUrl)
  }

  // Let next-intl handle the routing and locale detection
  return intlMiddleware(req)
})

export const config = {
  // Match all request paths except api, _next/static, _next/image, favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|crowd-sprite\\.png).*)'],
}
