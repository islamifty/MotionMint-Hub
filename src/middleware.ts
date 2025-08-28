import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // This is the most reliable way to check for setup completion.
  // The user MUST set this environment variable in their Vercel dashboard.
  const setupCompleted = process.env.SETUP_COMPLETED === 'true';

  if (!setupCompleted && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  if (setupCompleted && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // If setup isn't complete, don't process other rules.
  if (!setupCompleted) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  // Rule 1: If not logged in → protected route → redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Rule 2: If logged in → redirect away from public pages + role checks
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

  // Rule 3: Allow request
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
