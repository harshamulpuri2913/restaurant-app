/**
 * ============================================================================
 * USER SIGNUP API ROUTE
 * ============================================================================
 * API endpoint for new user registration.
 * 
 * Endpoints:
 * - POST /api/auth/signup - Create a new user account
 * 
 * Features:
 * - Email and password validation
 * - Duplicate email detection
 * - Secure password hashing with PBKDF2
 * - Email verification token generation
 * - Automatic verification email sending
 * - Default role assignment (customer)
 * 
 * Registration Flow:
 * 1. User submits email, password, name, phone
 * 2. Server validates input and checks for duplicates
 * 3. Password is hashed and user created
 * 4. Verification email sent with unique token
 * 5. User must verify email before full access
 * 
 * @public - No authentication required
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'

// =============================================================================
// POST - CREATE NEW USER
// =============================================================================

/**
 * Register a new user account
 * 
 * Request Body:
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "name": "John Doe",
 *   "phone": "5551234567"
 * }
 * ```
 * 
 * Required Fields:
 * - email: Valid email address
 * - password: Minimum 6 characters
 * 
 * Optional Fields:
 * - name: User's display name
 * - phone: Contact phone number
 * 
 * @param request - HTTP request with registration data
 * @returns Success message with user info (excluding password)
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // PARSE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { email, password, name, phone } = body

    // -------------------------------------------------------------------------
    // INPUT VALIDATION
    // -------------------------------------------------------------------------
    
    // Check required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // CHECK FOR EXISTING USER
    // -------------------------------------------------------------------------
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------------------------
    
    /**
     * Use PBKDF2 for password hashing (via shared utility)
     * PBKDF2 is built into Node.js and recommended by NIST
     */
    const hashedPassword = hashPassword(password)

    // -------------------------------------------------------------------------
    // GENERATE VERIFICATION TOKEN
    // -------------------------------------------------------------------------
    
    /**
     * Create secure random token for email verification
     * Token expires in 24 hours
     */
    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = new Date()
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

    // -------------------------------------------------------------------------
    // CREATE USER IN DATABASE
    // -------------------------------------------------------------------------
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        emailVerified: false,         // Must verify email first
        verificationToken,
        verificationTokenExpiry,
        role: 'customer',              // Default role for new users
      },
    })

    // -------------------------------------------------------------------------
    // SEND VERIFICATION EMAIL
    // -------------------------------------------------------------------------
    
    await sendVerificationEmail(email, verificationToken, name)

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: any) {
    // Handle Prisma unique constraint violation
    // This catches race condition where user created between check and insert
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create account. Please try again.',
        ...(process.env.NODE_ENV === 'development' ? {
          details: error?.message || 'Unknown error',
        } : {}),
      },
      { status: 500 }
    )
  }
}
