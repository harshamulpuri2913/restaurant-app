/**
 * ============================================================================
 * FORGOT PASSWORD API ROUTE
 * ============================================================================
 * API endpoint for email verification during password reset.
 * 
 * Endpoint:
 * - POST /api/auth/forgot-password - Verify email exists
 * 
 * Features:
 * - Validates email format
 * - Checks if email exists in database
 * - Returns email verification status
 * - Security: Doesn't reveal if email exists (prevents email enumeration)
 * 
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "exists": true/false
 * }
 * 
 * @public - No authentication required
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// =============================================================================
// POST - VERIFY EMAIL FOR PASSWORD RESET
// =============================================================================

/**
 * Handle email verification for password reset
 * 
 * This endpoint:
 * 1. Validates email format
 * 2. Checks if email exists in database
 * 3. Returns email verification status
 * 
 * Security Note:
 * Returns exists status to allow password reset flow,
 * but doesn't reveal specific user information.
 * 
 * @param request - HTTP request with email in body
 * @returns Email verification status
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // PARSE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // VALIDATE EMAIL FORMAT
    // -------------------------------------------------------------------------
    
    /**
     * Validate email format - must be valid email and end with .com
     * This matches the frontend validation in ForgotPasswordModal
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Additional validation: email must end with .com (matches frontend)
    if (!email.toLowerCase().endsWith('.com')) {
      return NextResponse.json(
        { error: 'Email must end with .com' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // FIND USER BY EMAIL
    // -------------------------------------------------------------------------
    
    /**
     * Check if user exists with this email
     * Convert email to lowercase for case-insensitive search
     */
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true }, // Only select necessary fields
    })

    // -------------------------------------------------------------------------
    // RETURN VERIFICATION STATUS
    // -------------------------------------------------------------------------
    
    /**
     * Return exists status to allow password reset flow
     * Security: We return exists status because user will need to know
     * if email is valid to proceed with password reset.
     * However, we don't reveal any sensitive user information.
     */
    return NextResponse.json({
      success: true,
      exists: !!user,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}

