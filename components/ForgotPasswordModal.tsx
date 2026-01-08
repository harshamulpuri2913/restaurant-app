/**
 * ============================================================================
 * FORGOT PASSWORD MODAL COMPONENT
 * ============================================================================
 * Modal component for password reset with email verification.
 * 
 * Features:
 * - Email input with validation
 * - Password and re-enter password fields (shown after email verification)
 * - Direct password reset without email sending
 * - Success/error toast notifications
 * - Reuses existing Modal and PasswordInput components
 * - Follows app design patterns
 * 
 * Usage:
 * <ForgotPasswordModal
 *   isOpen={showForgotPassword}
 *   onClose={() => setShowForgotPassword(false)}
 * />
 * 
 * @component
 */

'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './ui/Modal'
import PasswordInput from './ui/PasswordInput'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for ForgotPasswordModal component
 */
interface ForgotPasswordModalProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Function to close modal */
  onClose: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ForgotPasswordModal Component
 * 
 * Displays a modal form for password reset:
 * - Step 1: User enters email address
 * - Step 2: If email matches, show password and re-enter password fields
 * - User can reset password immediately without email verification
 */
export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------
  
  /**
   * Validate email format (must end with .com)
   * Matches validation used in signup/signin pages
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.toLowerCase().endsWith('.com')
  }

  /**
   * Validate password strength
   * Minimum 6 characters (matches signup validation)
   */
  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  /**
   * Validate passwords match
   */
  const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0
  }

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * Handle email verification step
   * Checks if email exists in database
   */
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address ending with .com')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to verify email')
        return
      }

      // If email exists, show password fields
      if (data.exists) {
        setEmailVerified(true)
        toast.success('Email verified! Please enter your new password.')
      } else {
        toast.error('Email address not found. Please check and try again.')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle password reset submission
   * Resets password directly without email token
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password
    if (!validatePassword(password)) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    // Validate passwords match
    if (!validatePasswordsMatch(password, confirmPassword)) {
      toast.error('Passwords do not match')
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
          email: email.toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Log error details for debugging
        console.error('❌ Password reset API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          code: data.code,
        })
        
        // Show error with details if available
        const errorMessage = data.error || 'Failed to reset password'
        const detailsMessage = data.details ? `\nDetails: ${data.details}` : ''
        toast.error(errorMessage + detailsMessage)
        return
      }

      // Success - show message and close modal
      toast.success(data.message || 'Password reset successful! You can now sign in.')

      // Reset form and close modal
      handleReset()
      onClose()
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle modal close
   * Resets all form state when closing
   */
  const handleClose = () => {
    handleReset()
    onClose()
  }

  /**
   * Reset all form fields and state
   */
  const handleReset = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setEmailVerified(false)
  }

  /**
   * Go back to email entry step
   */
  const handleBack = () => {
    setEmailVerified(false)
    setPassword('')
    setConfirmPassword('')
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🔑 Reset Password">
      {!emailVerified ? (
        // STEP 1: EMAIL VERIFICATION
        <form onSubmit={handleVerifyEmail} className="space-y-4">
          {/* Instructions */}
          <p className="text-cream text-sm">
            Enter your email address to verify your account.
          </p>

          {/* Email Input */}
          <div>
            <label
              htmlFor="forgot-password-email"
              className="block text-light-gold mb-2 font-traditional text-sm"
            >
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-golden disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="example@email.com"
              disabled={isLoading}
            />
            {email && !validateEmail(email) && (
              <p className="text-red-400 text-sm mt-1">
                Email must be valid and end with .com
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !validateEmail(email)}
              className="flex-1 px-4 py-2 bg-golden text-deep-brown rounded-lg hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional font-bold"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>
      ) : (
        // STEP 2: PASSWORD RESET
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Instructions */}
          <p className="text-cream text-sm">
            Enter your new password below.
          </p>

          {/* Email Display (Read-only) */}
          <div>
            <label className="block text-light-gold mb-2 font-traditional text-sm">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-lg text-cream opacity-70 cursor-not-allowed"
            />
          </div>

          {/* New Password Input */}
          <PasswordInput
            id="reset-password-new"
            name="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            minLength={6}
            disabled={isLoading}
            error={
              password && !validatePassword(password)
                ? 'Password must be at least 6 characters long'
                : undefined
            }
          />

          {/* Confirm Password Input */}
          <PasswordInput
            id="reset-password-confirm"
            name="confirmPassword"
            label="Re-enter Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            minLength={6}
            disabled={isLoading}
            error={
              confirmPassword && !validatePasswordsMatch(password, confirmPassword)
                ? 'Passwords do not match'
                : undefined
            }
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !validatePassword(password) ||
                !validatePasswordsMatch(password, confirmPassword)
              }
              className="flex-1 px-4 py-2 bg-golden text-deep-brown rounded-lg hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional font-bold"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

