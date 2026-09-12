import { NextRequest, NextResponse } from 'next/server';

// Paths that must be reachable without a valid session cookie.
// /api/week-summary and the auth endpoints do their own token checks.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/week-summary'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const expected = process.env.ACCESS_TOKEN;
  const cookieToken = req.cookies.get('access_token')?.value;

  if (pathname.startsWith('/api')) {
    const headerToken = req.headers.get('x-access-token');
    const queryToken = req.nextUrl.searchParams.get('token');
    if (expected && (cookieToken === expected || headerToken === expected || queryToken === expected)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!expected || cookieToken !== expected) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
