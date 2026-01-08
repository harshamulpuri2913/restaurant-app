/**
 * ============================================================================
 * SIGN IN PAGE
 * ============================================================================
 * User authentication page with email/password and Google OAuth sign-in.
 * 
 * Features:
 * - Email/password sign-in
 * - Password visibility toggle
 * - Forgot password functionality
 * - Google OAuth sign-in
 * - Email validation (must end with .com)
 * 
 * @component
 */

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PasswordInput from '@/components/ui/PasswordInput'
import ForgotPasswordModal from '@/components/ForgotPasswordModal'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  
  // Email validation - must end with .com and follow proper email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.toLowerCase().endsWith('.com')
  }
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email (must end with .com and be valid format)
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address ending with .com')
      return
    }
    
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Signed in successfully!')
        router.push('/menu')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-light-gold mb-2 font-traditional font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
                placeholder="example@email.com"
              />
              {email && !validateEmail(email) && (
                <p className="text-red-400 text-sm mt-1">
                  Email must be valid and end with .com
                </p>
              )}
            </div>

            {/* Password Input with Visibility Toggle */}
            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />

              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-golden hover:text-light-gold text-sm font-traditional underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-golden text-deep-brown py-3 rounded-lg font-bold text-lg hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2 border-golden"></div>
            <span className="px-4 text-light-gold font-traditional">OR</span>
            <div className="flex-1 border-t-2 border-golden"></div>
          </div>

          <button
            onClick={async () => {
              try {
                await signIn('google', { callbackUrl: '/menu' })
              } catch (error) {
                toast.error('Google sign-in is not configured. Please use email/password or contact Sai Datta Foods.')
              }
            }}
            className="w-full bg-white text-gray-700 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 font-traditional border-2 border-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-light-gold mt-6 text-sm">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="text-golden hover:text-light-gold font-bold underline"
            >
              Create new account
            </a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

