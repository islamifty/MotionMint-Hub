import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];
const apiRoutes = ['/api'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public routes and API routes to pass through
  if (
    publicRoutes.some(route => path.startsWith(route)) ||
    apiRoutes.some(route => path.startsWith(route))
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.user) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    // You can optionally add a 'from' query parameter to redirect back after login
    // loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control can be added here if needed
  // For example:
  // if (path.startsWith('/admin') && session.user.role !== 'admin') {
  //   return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
  // }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
