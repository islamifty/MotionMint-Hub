
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/api/bkash/callback', '/api/piprapay/callback'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if the route is public
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));

  if (isProtectedRoute) {
    const cookie = cookies().get('session')?.value;
    const session = await decrypt(cookie);

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    
    // Role-based access control
    const isAdmin = session.user.role === 'admin';

    if (path.startsWith('/admin') && !isAdmin) {
      // If a non-admin tries to access an admin route, redirect to client dashboard
      return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }
    
    if (path.startsWith('/client') && isAdmin) {
      // If an admin tries to access a client route, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes, except specific callbacks that are handled in publicRoutes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
