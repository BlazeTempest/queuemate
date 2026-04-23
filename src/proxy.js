import { NextResponse } from 'next/server';

export function proxy(request) {
  // 1. Get the auth token from the cookies
  // Make sure 'token' matches exactly what you named the cookie in your login/signup API route
  const token = request.cookies.get('queuemate_session')?.value;

  const currentPath = request.nextUrl.pathname;

  // 2. Define which routes require the user to be logged in
  const isProtectedRoute = currentPath.startsWith('/dashboard');

  // 3. Define which routes are ONLY for logged-out users (like the login/signup page)
  // Adjust '/' or '/login' based on where your Auth.jsx component lives
  const isAuthRoute = currentPath === '/' || currentPath === '/login';

  // --- THE LOGIC ---

  // If they try to access the dashboard without a token, kick them to the login page
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If they are already logged in and try to view the login page, push them to the dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Otherwise, let them pass normally
  return NextResponse.next();
}

// 4. Configure which routes this middleware should run on
// This prevents the middleware from running on static files, images, or API routes to save performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
