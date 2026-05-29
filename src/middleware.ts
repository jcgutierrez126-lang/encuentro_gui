import { NextRequest, NextResponse } from 'next/server'

const CATALOG_HOSTS = ['cafeelencuentro.com', 'www.cafeelencuentro.com']

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0]
  const { pathname } = request.nextUrl

  if (CATALOG_HOSTS.includes(host)) {
    // Reescribir la raíz al catálogo; el resto (assets, api) pasa normal
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/catalogo', request.url))
    }
    if (!pathname.startsWith('/catalogo') &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/favicon') &&
        !pathname.startsWith('/logo')) {
      return NextResponse.rewrite(new URL('/catalogo' + pathname, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
