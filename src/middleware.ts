import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/api/bkash/callback'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Allow public routes, including the bKash callback, to pass through
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // Role-based access control
  if (path.startsWith('/admin') && session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
  }
  if (path.startsWith('/client') && session.user.role === 'admin') {
    // Admins can be redirected from client pages to their dashboard
    return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
  }


  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - any files with an extension (e.g., favicon.ico, logo.png)
   */
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
