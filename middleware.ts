
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

async function isSetupComplete(req: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/setup/status', req.url);
    const response = await fetch(url.toString(), { 
        cache: 'no-store',
        headers: {
            // Forward cookie to bypass Vercel's deployment protection for internal API calls
            'cookie': req.headers.get('cookie') || '',
        }
    });
    
    if (!response.ok) {
        // Log the authentication issue but don't crash
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
  
  // First, check for Turso credentials. If not present, redirect to setup with an error.
  if (!process.env.KV_TURSO_DATABASE_URL || !process.env.KV_TURSO_AUTH_TOKEN) {
      if (path !== setupRoute) {
        const url = new URL(setupRoute, req.url);
        url.searchParams.set('error', 'db_not_configured');
        return NextResponse.redirect(url);
      }
      // Allow access to the setup page itself to show the error
      return NextResponse.next();
  }

  // If credentials exist, check if the setup process (first admin) is complete
  const setupCompleted = await isSetupComplete(req);

  // If setup is NOT complete, redirect any page to the setup page
  if (!setupCompleted && path !== setupRoute) {
    return NextResponse.redirect(new URL(setupRoute, req.url));
  }

  // If setup IS complete, redirect away from the setup page to the login page
  if (setupCompleted && path === setupRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // If we are on the setup page and it's not complete, allow the request
  if (path === setupRoute && !setupCompleted) {
    return NextResponse.next();
  }

  // --- Regular Authentication and Authorization Logic ---
  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user = session?.user;

  const isProtectedRoute =
    protectedAdminRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedClientRoutes.some((prefix) => path.startsWith(prefix)) ||
    protectedSharedRoutes.some((prefix) => path.startsWith(prefix));

  const isPublicRoute = publicRoutes.includes(path);

  // If not logged in and trying to access a protected route, redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in, handle role-based access and redirects from public pages
  if (user) {
    const dashboardUrl = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';

    // If on a public route or root, redirect to the appropriate dashboard
    if (isPublicRoute || path === '/') {
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }

    // Role-based route protection
    if (path.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    if (path.startsWith('/client') && user.role !== 'client') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Match all paths except for API routes, static files, and images
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
