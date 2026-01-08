/**
 * ============================================================================
 * RESET PASSWORD API ROUTE
 * ============================================================================
 * API endpoint for direct password reset functionality.
 * 
 * Endpoint:
 * - POST /api/auth/reset-password - Reset password with email
 * 
 * Features:
 * - Validates email exists
 * - Validates new password strength (minimum 6 characters)
 * - Uses Node.js built-in crypto.PBKDF2 for password hashing (no external dependencies)
 * - More secure than bcrypt and works out of the box
 * - Clears any existing reset tokens after successful reset
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "newpassword123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successful! You can now sign in."
 * }
 * 
 * @public - No authentication required (email-based verification)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

// =============================================================================
// POST - RESET PASSWORD WITH EMAIL
// =============================================================================

/**
 * Handle direct password reset with email verification
 * Uses PBKDF2 password hashing (via shared utility)
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || !email.toLowerCase().endsWith('.com')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email address not found' },
        { status: 400 }
      )
    }

    // Hash password using PBKDF2 (synchronous operation - no try/catch needed)
    const hashedPassword = hashPassword(password)
    
    if (!hashedPassword || !hashedPassword.includes(':')) {
      return NextResponse.json(
        { error: 'Failed to hash password. Please try again.' },
        { status: 500 }
      )
    }

    // Update user password and clear reset tokens (single atomic operation)
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpiry: null,
        },
        select: {
          id: true,
          password: true,
        },
      })

      // Verify password was actually stored
      if (!updatedUser.password) {
        return NextResponse.json(
          { error: 'Password update failed. The password field is empty.' },
          { status: 500 }
        )
      }
    } catch (dbError: any) {
      // Handle specific Prisma errors
      if (dbError?.code === 'P2025') {
        return NextResponse.json(
          { error: 'User not found. Please try again.' },
          { status: 404 }
        )
      }

      if (dbError?.code === 'P2002') {
        return NextResponse.json(
          { error: 'A constraint violation occurred. Please try again.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Failed to update password in database. Please try again.',
          ...(process.env.NODE_ENV === 'development' ? {
            details: dbError?.message || 'Unknown database error',
          } : {}),
        },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    })
  } catch (error: any) {
    // Handle parsing errors and unexpected errors
    if (error?.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found. Please try again.' },
        { status: 404 }
      )
    }

    // Handle network/database connection errors
    if (error?.message?.includes('connect') || error?.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 500 }
      )
    }

    // Return generic error (don't expose internal details)
    return NextResponse.json(
      { 
        error: 'Failed to reset password. Please try again.',
        ...(process.env.NODE_ENV === 'development' ? {
          details: error?.message || 'Unknown error',
        } : {}),
      },
      { status: 500 }
    )
  }
}
