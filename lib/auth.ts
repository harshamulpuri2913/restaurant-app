/**
 * ============================================================================
 * NEXTAUTH CONFIGURATION
 * ============================================================================
 * Authentication configuration for the Restaurant App using NextAuth.js.
 * 
 * Supported Authentication Methods:
 * - Email/Password (Credentials Provider)
 * - Google OAuth (if configured via environment variables)
 * 
 * Features:
 * - JWT-based session strategy
 * - Role-based access control (customer, admin)
 * - Email verification flow
 * - Automatic user creation for OAuth sign-ins
 * - Session persistence with user role and verification status
 * 
 * Environment Variables Required:
 * - NEXTAUTH_SECRET: Secret for JWT encryption
 * - NEXTAUTH_URL: Base URL of the application
 * - GOOGLE_CLIENT_ID: (Optional) Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: (Optional) Google OAuth client secret
 * 
 * @see https://next-auth.js.org/configuration/options
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import { verifyPassword, isBcryptHash } from './password'
import { generateVerificationToken, sendVerificationEmail } from './email'

// =============================================================================
// AUTH CONFIGURATION
// =============================================================================

/**
 * NextAuth configuration options
 * Exported for use in API route and middleware
 */
export const authOptions: NextAuthOptions = {
  // ---------------------------------------------------------------------------
  // AUTHENTICATION PROVIDERS
  // ---------------------------------------------------------------------------
  providers: [
    /**
     * Credentials Provider
     * Handles email/password authentication
     */
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      
      /**
       * Authorize function - validates credentials against database
       * @param credentials - Email and password from login form
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        // Validate input presence
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        // Check user exists and has password (not OAuth-only user)
        if (!user || !user.password) {
          return null
        }

        // Verify password - supports both bcrypt (old) and PBKDF2 (new) formats
        let isPasswordValid = false
        
        // Check if password uses bcrypt format (for backward compatibility)
        if (isBcryptHash(user.password)) {
          // Bcrypt format - use bcrypt.compare (backward compatibility during migration)
          // TODO: Remove bcryptjs after migration period when all users have PBKDF2 passwords
          try {
            const bcrypt = require('bcryptjs')
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } catch {
            // If bcryptjs is not available, password cannot be verified (migration incomplete)
            return null
          }
        } else {
          // PBKDF2 format - use shared utility
          isPasswordValid = verifyPassword(credentials.password, user.password)
        }

        if (!isPasswordValid) {
          return null
        }

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        }
      }
    }),
    
    /**
     * Google OAuth Provider
     * Only enabled if environment variables are configured
     */
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [])
  ],

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * Sign In Callback
     * Handles user creation and verification for OAuth sign-ins
     * 
     * @param user - User data from provider
     * @param account - Account/provider information
     * @param profile - Raw profile data from provider
     * @returns true to allow sign-in, false to deny
     */
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // Create new user for first-time Google sign-in
            const verificationToken = generateVerificationToken()
            const verificationTokenExpiry = new Date()
            verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || null,
                image: user.image || null,
                emailVerified: false,
                verificationToken,
                verificationTokenExpiry,
                role: 'customer', // Default role for new users
              },
            })

            // Send verification email to new user
            await sendVerificationEmail(user.email!, verificationToken, user.name || undefined)
          } else if (!existingUser.emailVerified) {
            // Resend verification email if user exists but not verified
            const verificationToken = generateVerificationToken()
            const verificationTokenExpiry = new Date()
            verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                verificationToken,
                verificationTokenExpiry,
                image: user.image || existingUser.image,
                name: user.name || existingUser.name,
              },
            })

            await sendVerificationEmail(user.email!, verificationToken, user.name || undefined)
          }
        } catch (error) {
          // Log error only in development mode
          // Allow sign-in even if email sending fails
          return true
        }
      }
      return true
    },

    /**
     * JWT Callback
     * Adds custom fields to JWT token
     * 
     * @param token - Current JWT token
     * @param user - User object (only on initial sign-in)
     * @param account - Account info (only on initial sign-in)
     * @returns Modified JWT token
     */
    async jwt({ token, user, account }) {
      // On initial sign-in, add user data to token
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.emailVerified = (user as any).emailVerified || false
      }
      
      // Refresh emailVerified status from database on each request
      // This ensures verification status is always current
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { emailVerified: true },
        })
        if (dbUser) {
          token.emailVerified = dbUser.emailVerified
        }
      }
      
      return token
    },

    /**
     * Session Callback
     * Transfers data from JWT to session object
     * 
     * @param session - Current session object
     * @param token - JWT token
     * @returns Modified session with user data
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as boolean
      }
      return session
    }
  },

  // ---------------------------------------------------------------------------
  // PAGES
  // ---------------------------------------------------------------------------
  
  /**
   * Custom pages configuration
   * Redirects to custom sign-in page instead of NextAuth default
   */
  pages: {
    signIn: '/signin',
  },

  // ---------------------------------------------------------------------------
  // SESSION CONFIGURATION
  // ---------------------------------------------------------------------------
  
  /**
   * Session strategy: JWT
   * - No database sessions table needed
   * - Tokens stored in cookies
   * - Scalable across multiple servers
   */
  session: {
    strategy: 'jwt',
  },

  // ---------------------------------------------------------------------------
  // SECURITY
  // ---------------------------------------------------------------------------
  
  /**
   * Secret for JWT encryption
   * MUST be set in production via NEXTAUTH_SECRET environment variable
   */
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production-minimum-32-characters-long',
}
