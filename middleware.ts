
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  // Rule 1: If the user is not logged in and is trying to access a protected route,
  // redirect them to the login page. This is the primary security check.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Rule 2: If the user is logged in, handle redirects away from public pages
  // and enforce role-based access.
  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    // If a logged-in user tries to access a public route (like /login) or the root,
    // redirect them to their appropriate dashboard.
    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.nextUrl));
    }

    // Role-based access control for protected routes.
    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }
    if (path.startsWith('/client') && user.role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }

  // Rule 3: If none of the above rules match, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
