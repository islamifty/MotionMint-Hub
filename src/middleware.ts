import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow API routes to pass through, they have their own auth checks if needed.
  if (path.startsWith('/api')) {
    return NextResponse.next();
  }

  const session = await getSession();
  const user = session?.user;

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.some((p) => path === p);

  // If the user is logged in
  if (user) {
    // And trying to access a public route (like login), redirect to dashboard
    if (isPublicRoute) {
      const url = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      return NextResponse.redirect(new URL(url, req.nextUrl));
    }

    // Role-based access control
    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }
    if (path.startsWith('/client') && user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  } 
  // If the user is not logged in
  else {
    // And trying to access a protected route, redirect to login
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
