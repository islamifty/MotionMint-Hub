import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const absoluteUrl = new URL(req.url);

  // Use fetch to call our internal API route to check setup status
  const statusApiUrl = new URL('/api/setup/status', absoluteUrl.origin);
  
  let setupCompleted = false;
  try {
    const response = await fetch(statusApiUrl, {
      headers: {
        'x-middleware-preflight': 'true',
      },
      // Disable caching to get the most up-to-date status
      cache: 'no-store',
    });
    
    if (response.ok) {
        const data = await response.json();
        setupCompleted = data.setupCompleted;
    } else {
        console.error(`Middleware: Failed to fetch setup status. API returned ${response.status}`);
    }
  } catch (error) {
     console.error(`Middleware: Error fetching setup status.`, error);
  }


  if (!setupCompleted && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  if (setupCompleted && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  // Rule 1: If not logged in → protected route → redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Rule 2: If logged in → redirect away from public pages + role checks
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

  // Rule 3: Allow request
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/setup/status|_next/static|_next/image|favicon.ico).*)'],
};
