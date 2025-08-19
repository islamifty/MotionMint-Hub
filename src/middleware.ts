import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];
const apiCallbackRoutes = ['/api/bkash/callback', '/api/piprapay/callback'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Allow public API callback routes to pass through without any checks
  if (apiCallbackRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);
  const currentUser = session?.user;

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));

  if (!currentUser && isProtectedRoute) {
    // If no user and trying to access a protected route, redirect to login
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';

    // If user is logged in, prevent access to login/register pages by redirecting them to their dashboard
    if (publicRoutes.includes(path)) {
       return NextResponse.redirect(new URL(isAdmin ? '/admin/dashboard' : '/client/dashboard', req.nextUrl));
    }
    
    // Role-based access control for protected routes
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
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * This ensures the middleware runs on all pages and API routes (except callbacks defined above).
   */
   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
