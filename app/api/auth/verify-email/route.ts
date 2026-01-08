/**
 * ============================================================================
 * EMAIL VERIFICATION API ROUTE
 * ============================================================================
 * API endpoint for email verification functionality.
 * 
 * Endpoints:
 * - GET /api/auth/verify-email?token=xxx - Verify email with token
 * - POST /api/auth/verify-email - Resend verification email
 * 
 * Features:
 * - Token-based email verification
 * - Token expiration checking (24 hours)
 * - Resend verification email for logged-in users
 * - Development mode fallback (returns link when email not configured)
 * 
 * Verification Flow:
 * 1. User clicks verification link in email
 * 2. Frontend redirects to /verify-email?token=xxx
 * 3. Frontend calls this API with the token
 * 4. API validates token and marks email as verified
 * 
 * @public GET - Token verification (no auth required)
 * @requires Authentication for POST (resend functionality)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'

// =============================================================================
// GET - VERIFY EMAIL WITH TOKEN
// =============================================================================

/**
 * Verify user's email using verification token
 * 
 * This endpoint is called when user clicks the verification link
 * in their email.
 * 
 * Query Parameters:
 * - token: The verification token from the email link
 * 
 * @example GET /api/auth/verify-email?token=abc123def456...
 * 
 * @param request - HTTP request with token parameter
 * @returns Success message or error
 */
export async function GET(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // EXTRACT TOKEN FROM URL
    // -------------------------------------------------------------------------
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // FIND USER BY TOKEN
    // -------------------------------------------------------------------------
    
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // CHECK TOKEN EXPIRATION
    // -------------------------------------------------------------------------
    
    /**
     * Tokens expire 24 hours after creation
     * User must request a new token if expired
     */
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // MARK EMAIL AS VERIFIED
    // -------------------------------------------------------------------------
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,        // Clear token after use
        verificationTokenExpiry: null,  // Clear expiry after use
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - RESEND VERIFICATION EMAIL
// =============================================================================

/**
 * Resend verification email to logged-in user
 * 
 * Use case: User didn't receive email or token expired.
 * User must be logged in to resend verification.
 * 
 * Flow:
 * 1. Validate user session
 * 2. Check if already verified
 * 3. Generate new verification token
 * 4. Send new verification email
 * 
 * @param request - HTTP request (body not required)
 * @returns Success message (includes link in dev mode without email service)
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // -------------------------------------------------------------------------
    // FIND USER IN DATABASE
    // -------------------------------------------------------------------------
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // CHECK IF ALREADY VERIFIED
    // -------------------------------------------------------------------------
    
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
      })
    }

    // -------------------------------------------------------------------------
    // GENERATE NEW VERIFICATION TOKEN
    // -------------------------------------------------------------------------
    
    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = new Date()
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    })

    // -------------------------------------------------------------------------
    // SEND VERIFICATION EMAIL
    // -------------------------------------------------------------------------
    
    const emailResult = await sendVerificationEmail(
      user.email, 
      verificationToken, 
      user.name || undefined
    )

    // -------------------------------------------------------------------------
    // BUILD RESPONSE
    // -------------------------------------------------------------------------
    
    /**
     * In development without Resend configured,
     * include the verification link in response
     */
    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`
    
    return NextResponse.json({
      success: true,
      message: process.env.RESEND_API_KEY 
        ? 'Verification email sent! Please check your inbox.' 
        : 'Email service not configured. Use the link below to verify.',
      // Include link when Resend is not configured (development)
      ...(!process.env.RESEND_API_KEY ? {
        verificationLink,
        note: 'Email service not configured. Click the link below to verify your email.',
      } : {}),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
