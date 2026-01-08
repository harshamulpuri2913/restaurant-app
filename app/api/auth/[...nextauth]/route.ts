/**
 * ============================================================================
 * NEXTAUTH API ROUTE HANDLER
 * ============================================================================
 * Main authentication API endpoint for the Restaurant App.
 * 
 * This route handles all NextAuth.js authentication requests including:
 * - Sign in (credentials and OAuth)
 * - Sign out
 * - Session management
 * - CSRF token generation
 * - Provider callbacks
 * 
 * The actual authentication logic is defined in @/lib/auth
 * This file just exports the NextAuth handler.
 * 
 * Endpoints handled by NextAuth:
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin/:provider - Provider sign in
 * - GET /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out action
 * - GET /api/auth/session - Get session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - List providers
 * - GET /api/auth/callback/:provider - OAuth callback
 * 
 * @see https://next-auth.js.org/getting-started/rest-api
 * @see /lib/auth.ts for authentication configuration
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth handler instance
 * Configured with options from /lib/auth.ts
 */
const handler = NextAuth(authOptions)

/**
 * Export handler for both GET and POST requests
 * NextAuth uses both methods for different operations
 */
export { handler as GET, handler as POST }
