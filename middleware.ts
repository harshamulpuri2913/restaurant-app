/**
 * ============================================================================
 * NEXT.JS MIDDLEWARE
 * ============================================================================
 * Authentication middleware for protecting routes in the Restaurant App.
 * 
 * This middleware uses NextAuth.js to protect specified routes,
 * redirecting unauthenticated users to the sign-in page.
 * 
 * Protected Routes:
 * - /menu/*    - Menu browsing (authenticated users only)
 * - /checkout/* - Checkout process (authenticated users only)
 * - /orders/*  - Order history and tracking (authenticated users only)
 * - /admin/*   - Admin dashboard (additional role check in components)
 * 
 * Public Routes (not protected):
 * - /          - Home page
 * - /signin    - Sign in page
 * - /signup    - Registration page
 * - /verify-email - Email verification page
 * - /reset-password - Password reset page
 * - /api/*     - API routes (have their own auth checks)
 * 
 * How it works:
 * 1. Middleware runs on every request matching the matcher pattern
 * 2. NextAuth checks for a valid session/JWT token
 * 3. If no valid session, redirects to /signin
 * 4. If valid session, request proceeds normally
 * 
 * Note: This only checks authentication (is user logged in?),
 * not authorization (does user have permission?). Role-based
 * checks are handled in individual pages and API routes.
 * 
 * @see https://next-auth.js.org/configuration/nextjs#middleware
 */

import { withAuth } from 'next-auth/middleware'

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Wrap default Next.js middleware with NextAuth authentication
 * 
 * The withAuth wrapper automatically:
 * - Checks for valid JWT token in cookies
 * - Redirects to signIn page if not authenticated
 * - Allows request to proceed if authenticated
 */
export default withAuth({
  /**
   * Custom pages configuration
   * Specifies where to redirect for authentication
   */
  pages: {
    signIn: '/signin',
  },
})

// =============================================================================
// ROUTE MATCHER
// =============================================================================

/**
 * Configure which routes this middleware applies to
 * 
 * Uses Next.js route matching syntax:
 * - /menu/:path*     - Matches /menu, /menu/anything, etc. (protected - authenticated only)
 * - /checkout/:path* - Matches /checkout, /checkout/confirm, etc. (protected - authenticated only)
 * - /orders/:path*   - Matches /orders, /orders/123, etc. (protected - authenticated only)
 * - /admin/:path*    - Matches /admin, /admin/settings, etc. (protected - admin only)
 * 
 * Routes NOT in this list are public (no auth required):
 * - / (home page)
 * - /signin
 * - /signup
 * - /verify-email
 * - /reset-password
 * - /api/* (API routes handle their own auth)
 */
export const config = {
  matcher: [
    '/menu/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/admin/:path*'
  ],
}
