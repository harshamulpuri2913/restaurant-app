/**
 * ============================================================================
 * USERS API ROUTE
 * ============================================================================
 * Admin endpoint for user management.
 * 
 * Endpoints:
 * - POST /api/users - Create a new user (admin only)
 * 
 * Features:
 * - Create users with custom roles
 * - Secure password hashing
 * - Duplicate email detection
 * - Admin-only access
 * 
 * Use Cases:
 * - Creating staff accounts
 * - Setting up additional admin users
 * - Bypassing normal registration flow
 * 
 * Access Control:
 * - Admin only - Regular users cannot create accounts via this endpoint
 * 
 * Note: Regular user registration should use /api/auth/signup
 * This endpoint is for admin-created accounts only.
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

// =============================================================================
// POST - CREATE USER (ADMIN)
// =============================================================================

/**
 * Create a new user account (admin functionality)
 * 
 * Unlike signup, this endpoint:
 * - Requires admin authentication
 * - Allows setting custom roles
 * - Does not send verification email
 * - Does not set verification token
 * 
 * Request Body:
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "name": "John Doe",
 *   "phone": "5551234567",
 *   "role": "customer"
 * }
 * ```
 * 
 * Required Fields:
 * - email: Valid email address
 * - password: User's password
 * 
 * Optional Fields:
 * - name: User's display name
 * - phone: Contact phone number
 * - role: User role (customer, admin) - defaults to customer
 * 
 * @param request - HTTP request with user data
 * @returns Created user info (excluding password)
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // PARSE AND VALIDATE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { email, password, name, phone, role } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------------------------
    
    /**
     * Use PBKDF2 for password hashing (via shared utility)
     * Same as signup endpoint for consistency
     */
    const hashedPassword = hashPassword(password)

    // -------------------------------------------------------------------------
    // CREATE USER IN DATABASE
    // -------------------------------------------------------------------------
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role || 'customer',  // Default to customer if not specified
      },
    })

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    /**
     * Return user data excluding sensitive fields like password
     */
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error: any) {
    /**
     * Handle Prisma unique constraint violation
     * Error code P2002 indicates duplicate email
     */
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
