import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client'];
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
