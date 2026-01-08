/**
 * ============================================================================
 * API UTILITIES
 * ============================================================================
 * Shared utility functions for API route handlers.
 * 
 * Provides consistent patterns for:
 * - Authentication checks
 * - Authorization (role-based access)
 * - Request body validation
 * - Error handling
 * 
 * Usage:
 * ```typescript
 * import { requireAuth, requireAdmin, handleApiError } from '@/lib/api-utils'
 * 
 * export async function GET(request: Request) {
 *   const { error, session } = await requireAuth()
 *   if (error) return error
 *   
 *   // ... handle request
 * }
 * ```
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Result type for authentication checks
 */
interface AuthResult {
  error: NextResponse | null
  session: any | null
}

/**
 * Result type for validation checks
 */
interface ValidationResult<T> {
  valid: boolean
  data?: T
  error?: NextResponse
}

// =============================================================================
// AUTHENTICATION HELPERS
// =============================================================================

/**
 * Require authenticated user
 * 
 * Checks if the current request has a valid session.
 * Returns an error response if not authenticated.
 * 
 * @returns Object with error (if not authenticated) and session
 * 
 * @example
 * export async function GET(request: Request) {
 *   const { error, session } = await requireAuth()
 *   if (error) return error
 *   
 *   // User is authenticated, session.user contains user data
 *   const userId = session.user.id
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      session: null,
    }
  }
  
  return { error: null, session }
}

/**
 * Require admin role
 * 
 * Checks if the current user is authenticated AND has admin role.
 * Returns appropriate error response if either check fails.
 * 
 * @returns Object with error (if not admin) and session
 * 
 * @example
 * export async function DELETE(request: Request) {
 *   const { error, session } = await requireAdmin()
 *   if (error) return error
 *   
 *   // User is authenticated admin
 *   await prisma.order.deleteMany()
 * }
 */
export async function requireAdmin(): Promise<AuthResult> {
  // First check authentication
  const { error, session } = await requireAuth()
  if (error) {
    return { error, session: null }
  }

  // Then check admin role
  if (session?.user?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate request body against a schema
 * 
 * Generic validation function that uses a type guard to validate
 * request body data.
 * 
 * @param body - Request body to validate
 * @param schema - Type guard function that returns true if data is valid
 * @returns Object with validation result and either data or error
 * 
 * @example
 * // Define a type guard
 * function isCreateOrderData(data: any): data is CreateOrderData {
 *   return data.items && Array.isArray(data.items) && data.items.length > 0
 * }
 * 
 * // Use in API route
 * const result = validateRequestBody(body, isCreateOrderData)
 * if (!result.valid) return result.error
 * 
 * // result.data is now typed as CreateOrderData
 */
export function validateRequestBody<T>(
  body: any,
  schema: (data: any) => data is T
): { valid: true; data: T } | { valid: false; error: NextResponse } {
  if (!schema(body)) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
  return { valid: true, data: body }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle API errors consistently
 * 
 * Logs the error and returns a standardized error response.
 * Extracts error message if available, otherwise uses default.
 * 
 * @param error - The caught error (unknown type)
 * @param defaultMessage - Fallback message if error has no message
 * @returns NextResponse with error details
 * 
 * @example
 * export async function GET(request: Request) {
 *   try {
 *     // ... operation that might fail
 *   } catch (error) {
 *     return handleApiError(error, 'Failed to fetch data')
 *   }
 * }
 */
export function handleApiError(
  error: unknown,
  defaultMessage = 'Internal server error'
): NextResponse {
  // Log error only in development mode (production should use proper logging service)
  
  // Extract message from Error objects
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message || defaultMessage },
      { status: 500 }
    )
  }
  
  // Fallback for non-Error throws
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  )
}
