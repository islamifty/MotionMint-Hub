import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];
const apiRoutes = ['/api'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if the route is an API route
  const isApiRoute = apiRoutes.some((prefix) => path.startsWith(prefix));
  if (isApiRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);
  const user = session?.user;

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && user) {
     const url = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
     return NextResponse.redirect(new URL(url, req.nextUrl));
  }
  
  // Role-based access control for logged-in users
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
