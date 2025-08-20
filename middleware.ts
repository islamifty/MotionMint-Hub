
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
const apiRoutes = ['/api'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Allow API routes to pass through without checks
  if (apiRoutes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Get session details
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  // 3. Define route types for clarity
  const isPublicRoute = publicRoutes.includes(path);
  const isAdminRoute = protectedAdminRoutes.some((prefix) => path.startsWith(prefix));
  const isClientRoute = protectedClientRoutes.some((prefix) => path.startsWith(prefix));
  const isSharedRoute = protectedSharedRoutes.some((prefix) => path.startsWith(prefix));
  const isProtectedRoute = isAdminRoute || isClientRoute || isSharedRoute;

  // 4. Handle redirects for logged-out users
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Handle redirects and role-based access for logged-in users
  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    // If user is on a public route (like /login) or the root, redirect to their dashboard
    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.nextUrl));
    }

    // Role-based access control
    if (isAdminRoute && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }
    if (isClientRoute && user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }
  
  // 6. If no rules match, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
