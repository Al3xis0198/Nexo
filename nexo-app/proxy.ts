// proxy.ts — Next.js Route Protection (Middleware)
// IMPORTANTE: En este proyecto (Next.js 16), la convención "middleware.ts"
// está obsoleta y se debe usar "proxy.ts" en la raíz para que sea detectado.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT_ID')

const PUBLIC_ROUTES = ['/login', '/register', '/auth']
const PROTECTED_PREFIXES = ['/dashboard', '/markets', '/trade', '/portfolio', '/wallet', '/admin', '/settings', '/binary']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // En modo demo dejamos pasar todo — el AuthContext maneja el estado local
  if (DEMO_MODE) {
    return NextResponse.next()
  }

  // Inicializar response que pasaremos y modificaremos con cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sesión si expiró (IMPORTANTE: usar getUser, no getSession)
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIXES.some(r => pathname.startsWith(r))

  // Sin sesión intentando ruta protegida → redirigir al login
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión en ruta de auth → redirigir al dashboard
  if (user && isPublicRoute && !pathname.startsWith('/auth')) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
