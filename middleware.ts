// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/actions/auth';

// Admin-only routes
const adminRoutes = ['/dashboard', '/settings', '/users'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the route requires admin access
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  
  if (isAdminRoute) {
    // Verify session
    const sessionResult = await verifySession();
    
    // if (!sessionResult.valid || !sessionResult.user?.isAdmin) {
    //   // Redirect to login with error message
    //   const loginUrl = new URL('/login', request.url);
      
    //   if (sessionResult.error === 'Session expired') {
    //     loginUrl.searchParams.set('error', 'session-expired');
    //   } else if (sessionResult.error === 'Invalid user session') {
    //     loginUrl.searchParams.set('error', 'unauthorized');
    //   } else {
    //     loginUrl.searchParams.set('error', 'login-required');
    //   }
      
    //   return NextResponse.redirect(loginUrl);
    // }
    
    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', sessionResult.user.uid);
    requestHeaders.set('x-user-email', sessionResult.user.email);
    requestHeaders.set('x-user-role', sessionResult.user.role);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/users/:path*',
  ],
};