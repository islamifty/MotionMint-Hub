import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/admin', '/client'];
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
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
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
