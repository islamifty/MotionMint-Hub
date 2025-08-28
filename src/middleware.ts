
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Fundamental check: Are the database credentials even set in the environment?
  // This is the simplest and most reliable check the middleware can perform.
  if (!process.env.KV_TURSO_DATABASE_URL || !process.env.KV_TURSO_AUTH_TOKEN) {
      if (path !== setupRoute) {
        const url = new URL(setupRoute, req.url);
        url.searchParams.set('error', 'db_not_configured');
        return NextResponse.redirect(url);
      }
      // Allow access to the setup page itself to show the configuration error.
      return NextResponse.next();
  }

  // The more complex logic of "is the first admin created?" is now handled by the /setup page itself,
  // which can safely query the database without Vercel's deployment protection interfering.
  // The middleware's job is simplified to just protecting routes and handling basic redirects.

  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  // If not logged in and trying to access a protected route, redirect to login
  if (!user && isProtectedRoute) {
    // Exception: Don't protect the setup page itself if credentials are set but setup isn't complete.
    // The setup page will handle its own logic.
    if (path === setupRoute) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in, handle role-based access and redirects from public pages
  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    // If on a public route (including /setup if logged in) or root, redirect to the appropriate dashboard
    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // Role-based route protection
    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    if (path.startsWith('/client') && user.role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Match all paths except for API routes, static files, and images
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
