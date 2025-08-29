import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';

const protectedAdminRoutes = ['/admin'];
const protectedClientRoutes = ['/client'];
const protectedSharedRoutes = ['/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/setup'];
const setupRoute = '/setup';

// This function checks if the initial setup (first admin creation) has been completed.
async function isSetupComplete(): Promise<boolean> {
  try {
    // A simple way to check is to see if any admin user exists.
    const adminUser = await db.select({ id: users.id }).from(users).where(sql`${users.role} = 'admin'`).limit(1);
    return adminUser.length > 0;
  } catch (error: any) {
    // This can happen if the 'users' table doesn't exist yet.
    // In that case, setup is definitely not complete.
    if (error.message?.includes('no such table') || error.message?.includes('NOT_FOUND')) {
      console.warn("Setup check: 'users' table not found. Setup is not complete.");
      return false;
    }
    // For other errors, log them but assume setup isn't complete to be safe.
    console.error("Error checking setup status in middleware:", error);
    return false;
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
  const setupCompleted = await isSetupComplete();

  // If setup is NOT complete, redirect any page (except the setup page itself) to the setup page
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
