
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

// The root path '/' is added to protectedRoutes to ensure logged-in users are redirected to their dashboard.
const protectedRoutes = ['/', '/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];
const apiRoutes = ['/api'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isApiRoute = apiRoutes.some((prefix) => path.startsWith(prefix));
  if (isApiRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  // Handle redirection for the root path specifically for logged-in users.
  if (path === '/' && user) {
    const url = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return NextResponse.redirect(new URL(url, req.nextUrl));
  }
  
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && user) {
     const url = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
     return NextResponse.redirect(new URL(url, req.nextUrl));
  }
  
  if (user) {
    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }
    if (path.startsWith('/client') && user.role === 'admin') {
       return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
