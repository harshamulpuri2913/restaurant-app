/**
 * ============================================================================
 * EMAIL SERVICE
 * ============================================================================
 * Email functionality for the Restaurant App using Resend API.
 * 
 * Features:
 * - Email verification for new user registrations
 * - Password reset emails
 * - Branded HTML email templates
 * - Development mode fallback (logs instead of sending)
 * - Secure token generation for verification links
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: API key from Resend (https://resend.com)
 * - NEXTAUTH_URL: Base URL for verification links
 * - EMAIL_FROM: (Optional) Sender email address
 * 
 * @see https://resend.com/docs
 */

import { Resend } from 'resend'
import crypto from 'crypto'

// =============================================================================
// RESEND CLIENT INITIALIZATION
// =============================================================================

/**
 * Resend API client instance
 * Only initialized if API key is configured
 * Null in development mode without API key
 */
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Generate a cryptographically secure verification token
 * Used for email verification links
 * 
 * @returns 64-character hex string token
 * 
 * @example
 * const token = generateVerificationToken()
 * // Returns: "a1b2c3d4e5f6..."
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

/**
 * Send email verification to a user
 * 
 * Sends a branded HTML email with a verification link.
 * In development mode (no API key), logs the email details instead.
 * 
 * @param email - Recipient email address
 * @param token - Verification token to include in link
 * @param name - Optional recipient name for personalization
 * @returns Promise with success status and optional error message
 * 
 * @example
 * const result = await sendVerificationEmail(
 *   'user@example.com',
 *   'abc123token',
 *   'John Doe'
 * )
 * 
 * if (result.success) {
 *   console.log('Email sent!')
 * } else {
 *   console.error('Failed:', result.error)
 * }
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ---------------------------------------------------------------------------
    // DEVELOPMENT MODE FALLBACK
    // ---------------------------------------------------------------------------
    
    /**
     * If Resend is not configured, log email details instead of sending
     * This allows testing without email service in development
     */
    if (!resend || !process.env.RESEND_API_KEY) {
      // Development mode: Email service not configured
      if (process.env.NODE_ENV === 'development') {
        // Only log in development mode
      }
      return { success: true, error: 'Email service not configured (development mode)' }
    }

    // ---------------------------------------------------------------------------
    // CONSTRUCT EMAIL
    // ---------------------------------------------------------------------------
    
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

    // ---------------------------------------------------------------------------
    // SEND EMAIL VIA RESEND
    // ---------------------------------------------------------------------------
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Verify your email - Sai Datta Snacks & Savories',
      
      /**
       * Branded HTML email template
       * Includes:
       * - Restaurant branding with golden accent colors
       * - Personalized greeting
       * - Clear call-to-action button
       * - Fallback plain text link
       * - Expiration notice (24 hours)
       */
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                color: #8B4513;
                border-bottom: 3px solid #D4AF37;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #D4AF37;
                color: #5C2E0A;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SAI DATTA</h1>
                <p>Snacks & Savories</p>
              </div>
              <h2>Verify Your Email Address</h2>
              <p>Hello${name ? ` ${name}` : ''},</p>
              <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Sai Datta Snacks & Savories. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // ---------------------------------------------------------------------------
    // HANDLE RESPONSE
    // ---------------------------------------------------------------------------
    
    if (error) {
      // Log error only in development mode
      if (process.env.NODE_ENV === 'development') {
        // Error logging for development debugging
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    // Log error only in development mode
    if (process.env.NODE_ENV === 'development') {
      // Error logging for development debugging
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send password reset email to a user
 * 
 * Sends a branded HTML email with a password reset link.
 * In development mode (no API key), logs the email details instead.
 * 
 * @param email - Recipient email address
 * @param token - Password reset token to include in link
 * @param name - Optional recipient name for personalization
 * @returns Promise with success status and optional error message
 * 
 * @example
 * const result = await sendPasswordResetEmail(
 *   'user@example.com',
 *   'abc123token',
 *   'John Doe'
 * )
 * 
 * if (result.success) {
 *   console.log('Reset email sent!')
 * } else {
 *   console.error('Failed:', result.error)
 * }
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ---------------------------------------------------------------------------
    // DEVELOPMENT MODE FALLBACK
    // ---------------------------------------------------------------------------
    
    /**
     * If Resend is not configured, log email details instead of sending
     * This allows testing without email service in development
     */
    if (!resend || !process.env.RESEND_API_KEY) {
      // Development mode: Email service not configured
      return { success: true, error: 'Email service not configured (development mode)' }
    }

    // ---------------------------------------------------------------------------
    // CONSTRUCT EMAIL
    // ---------------------------------------------------------------------------
    
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

    // ---------------------------------------------------------------------------
    // SEND EMAIL VIA RESEND
    // ---------------------------------------------------------------------------
    
    // Send email via Resend API
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Reset your password - Sai Datta Snacks & Savories',
      
      /**
       * Branded HTML email template for password reset
       * Includes:
       * - Restaurant branding with golden accent colors
       * - Personalized greeting
       * - Clear call-to-action button
       * - Fallback plain text link
       * - Security notice (24 hour expiration)
       * - Warning if user didn't request reset
       */
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                color: #8B4513;
                border-bottom: 3px solid #D4AF37;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #D4AF37;
                color: #5C2E0A;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SAI DATTA</h1>
                <p>Snacks & Savories</p>
              </div>
              <h2>Reset Your Password</h2>
              <p>Hello${name ? ` ${name}` : ''},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Sai Datta Snacks & Savories. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // ---------------------------------------------------------------------------
    // HANDLE RESPONSE
    // ---------------------------------------------------------------------------
    
    if (error) {
      // Log error only in development mode
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    // Log error only in development mode
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
