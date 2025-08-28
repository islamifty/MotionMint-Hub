import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', ' /settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

async function isSetupComplete(): Promise<boolean> {
  try {
    // We can't use drizzle here because it's not edge-compatible.
    // So we use the Turso HTTP API to check if the users table exists.
    const response = await fetch(`${process.env.TURSO_DATABASE_URL}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: ["SELECT name FROM sqlite_master WHERE type='table' AND name='users';"],
      }),
      cache: 'no-store',
    });
    
    if (!response.ok) {
        console.error("Middleware: Failed to check DB status", await response.text());
        return false; // Fail safe
    }

    const data = await response.json();
    return data.results[0].rows.length > 0;

  } catch (error) {
    console.error("Middleware: Error connecting to Turso to check setup status:", error);
    return false; // Fail safe
  }
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      if (path !== setupRoute) {
        // If DB is not configured, show a message on the setup page
        const url = new URL(setupRoute, req.url);
        url.searchParams.set('error', 'db_not_configured');
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
  }

  const setupCompleted = await isSetupComplete();

  if (!setupCompleted && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  if (setupCompleted && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  if (!setupCompleted) {
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
