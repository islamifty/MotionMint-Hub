import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', ' /settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

async function isSetupComplete(req: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/setup/status', req.url);
    const response = await fetch(url.toString(), { cache: 'no-store' });
    
    if (!response.ok) {
        console.error("Middleware: Failed to fetch setup status", await response.text());
        return false; // Fail safe
    }

    const data = await response.json();
    return data.setupCompleted;

  } catch (error) {
    console.error("Middleware: Error fetching setup status:", error);
    return false; // Fail safe
  }
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      if (path !== setupRoute) {
        const url = new URL(setupRoute, req.url);
        url.searchParams.set('error', 'db_not_configured');
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
  }

  const setupCompleted = await isSetupComplete(req);

  if (!setupCompleted && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  if (setupCompleted && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  if (path === setupRoute && !setupCompleted) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    if (path.startsWith('/client') && user.role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
