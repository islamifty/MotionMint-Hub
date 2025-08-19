import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';

const protectedRoutes = ['/admin', '/client', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];
const paymentCallbackRoutes = ['/api/bkash/callback', '/api/piprapay/callback'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow specific public API routes (like payment callbacks) to pass through without checks
  if (paymentCallbackRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);
  const user = session?.user;

  // 1. If user is not logged in and trying to access a protected route
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // 2. If user is logged in
  if (user) {
    // 2a. If they try to access a public route (like /login), redirect to the appropriate dashboard
    if (isPublicRoute) {
      const isAdmin = user.role === 'admin';
      return NextResponse.redirect(new URL(isAdmin ? '/admin/dashboard' : '/client/dashboard', req.nextUrl));
    }

    // 2b. Role-based access control for protected routes
    const db = readDb();
    const dbUser = db.users.find(u => u.id === user.id);

    // If user from session is not in DB (e.g., deleted), redirect to login and clear cookie
    if (!dbUser) {
        const response = NextResponse.redirect(new URL('/login', req.nextUrl));
        response.cookies.delete('session');
        return response;
    }
    
    // Enforce admin-only access to admin routes
    if (path.startsWith('/admin') && dbUser.role !== 'admin') {
        return NextResponse.redirect(new URL('/client/dashboard', req.nextUrl));
    }

    // Prevent admins from accessing client-specific routes if needed
    if (path.startsWith('/client') && dbUser.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  }

  // 3. If none of the above conditions are met, continue to the requested path
  return NextResponse.next();
}

// This config matches all request paths except for files in _next/static, _next/image, and favicon.ico.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
