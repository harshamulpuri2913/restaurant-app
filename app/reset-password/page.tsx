/**
 * ============================================================================
 * RESET PASSWORD PAGE
 * ============================================================================
 * Page for resetting user password using a token from email link.
 * 
 * Features:
 * - Token validation from URL query parameter
 * - New password input with confirmation
 * - Password visibility toggle
 * - Strength validation (minimum 6 characters)
 * - Success/error handling
 * 
 * URL Format:
 * /reset-password?token=abc123def456...
 * 
 * Flow:
 * 1. User clicks reset link in email
 * 2. This page loads with token in URL
 * 3. User enters new password (twice for confirmation)
 * 4. Password is reset via API
 * 5. User is redirected to sign-in page
 * 
 * @component
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import PasswordInput from '@/components/ui/PasswordInput'

// =============================================================================
// COMPONENT (Inner - Uses useSearchParams)
// =============================================================================

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------
  
  /**
   * Extract token from URL query parameter on mount
   */
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      toast.error('Invalid reset link. Please request a new password reset.')
      router.push('/signin')
    }
  }, [searchParams, router])

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------
  
  /**
   * Check if passwords match
   */
  const passwordsMatch = password === confirmPassword

  /**
   * Check if form is valid
   */
  const isFormValid =
    password.length >= 6 && confirmPassword.length >= 6 && passwordsMatch

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * Handle form submission
   * Validates passwords and sends reset request to API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to reset password')
        return
      }

      // Success - show message and redirect to sign-in
      toast.success('Password reset successful! You can now sign in.')
      router.push('/signin?message=Password reset successful. Please sign in.')
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center textured-bg p-4">
        <div className="w-full max-w-md">
          <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
            <p className="text-cream">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center textured-bg p-4">
      <div className="w-full max-w-md">
        <div className="traditional-border bg-deep-brown p-8 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold golden-text mb-2 font-traditional">
              SAI DATTA
            </h1>
            <p className="text-light-gold text-xl font-traditional">
              Snacks & Savories
            </p>
            <p className="text-cream mt-2 text-sm">Reset Your Password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <PasswordInput
              id="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              disabled={isLoading}
              error={
                password.length > 0 && password.length < 6
                  ? 'Password must be at least 6 characters'
                  : undefined
              }
            />

            {/* Confirm Password */}
            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
              disabled={isLoading}
              error={
                confirmPassword.length > 0 && !passwordsMatch
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            {/* Success Indicator */}
            {password &&
              confirmPassword &&
              passwordsMatch &&
              password.length >= 6 && (
                <p className="text-green-400 text-sm">
                  ✓ Passwords match
                </p>
              )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full bg-golden text-deep-brown py-3 rounded-lg font-bold text-lg hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-light-gold mt-6 text-sm">
            Remember your password?{' '}
            <a
              href="/signin"
              className="text-golden hover:text-light-gold font-bold underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENT (Outer - Wraps in Suspense)
// =============================================================================

/**
 * Reset Password Page
 * 
 * Wrapped in Suspense to handle useSearchParams hook
 * which requires dynamic rendering
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center textured-bg p-4">
          <div className="w-full max-w-md">
            <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
              <p className="text-cream">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

