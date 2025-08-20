
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

  // 1. Allow API routes to pass through
  if (apiRoutes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Get session
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isPublicRoute = publicRoutes.includes(path);
  const isAdminRoute = protectedAdminRoutes.some((prefix) => path.startsWith(prefix));
  const isClientRoute = protectedClientRoutes.some((prefix) => path.startsWith(prefix));
  const isSharedRoute = protectedSharedRoutes.some((prefix) => path.startsWith(prefix));
  
  const isProtectedRoute = isAdminRoute || isClientRoute || isSharedRoute || path === '/';


  // 3. Handle redirects for logged-in users
  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    
    // If logged-in user tries to access a public route (like /login) or the root, redirect to their dashboard
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
    
  } else {
    // 4. Handle redirects for logged-out users
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }
  
  // 5. If no rules match, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
