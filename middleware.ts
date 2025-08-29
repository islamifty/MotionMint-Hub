import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';
let isSetupComplete = false;

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  const tursoDbUrl = process.env.KV_TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.KV_TURSO_AUTH_TOKEN;

  if (!tursoDbUrl || !tursoAuthToken) {
    if (path !== setupRoute) {
      const url = new URL(setupRoute, req.url);
      url.searchParams.set('error', 'db_not_configured');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  if (user?.role === 'admin') {
    isSetupComplete = true;
  }
  
  if (!isSetupComplete) {
    const response = await fetch(new URL('/api/setup/status', req.url), {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      isSetupComplete = data.setupCompleted;
    }
  }

  if (!isSetupComplete && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  if (isSetupComplete && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    if (path.startsWith('/client') && user.role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
