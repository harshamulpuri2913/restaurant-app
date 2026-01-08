/**
 * ============================================================================
 * SIGN UP PAGE
 * ============================================================================
 * User registration page with email/password and Google OAuth sign-up.
 * 
 * Features:
 * - Email/password registration
 * - Password confirmation (re-enter password)
 * - Password visibility toggle
 * - Google OAuth sign-up
 * - Email validation (must end with .com)
 * - Phone number validation (10 digits)
 * 
 * @component
 */

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PasswordInput from '@/components/ui/PasswordInput'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Email validation - must end with .com and follow proper email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.toLowerCase().endsWith('.com')
  }
  
  // Phone validation - only allow 10 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length <= 10) {
      setPhone(value)
    }
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
    
    // Validate password length
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    // Validate phone if provided (must be exactly 10 digits)
    if (phone && phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          phone: phone || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create account')
        return
      }

      toast.success('Account created! Please check your email to verify your account.')
      router.push('/signin?message=Account created. Please verify your email.')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await signIn('google', { callbackUrl: '/menu' })
    } catch (error) {
      toast.error('Google sign-in is not configured. Please use email/password signup.')
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
            <p className="text-cream mt-2 text-sm">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-light-gold mb-2 font-traditional text-sm">
                Full Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-golden"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-light-gold mb-2 font-traditional text-sm font-semibold">
                Email *
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

            {/* Password Input */}
            <PasswordInput
              id="password"
              label="Password"
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

            {/* Re-enter Password Input */}
            <PasswordInput
              id="confirmPassword"
              label="Re-enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={6}
              disabled={isLoading}
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            {/* Password Match Indicator */}
            {password &&
              confirmPassword &&
              password === confirmPassword &&
              password.length >= 6 && (
                <p className="text-green-400 text-sm">✓ Passwords match</p>
              )}

            <div>
              <label htmlFor="phone" className="block text-light-gold mb-2 font-traditional text-sm font-semibold">
                Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
                placeholder="2095978565"
              />
              {phone && phone.length !== 10 && (
                <p className="text-red-400 text-sm mt-1">
                  Phone number must be exactly 10 digits
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-golden text-deep-brown py-3 rounded-lg font-bold text-lg hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-traditional"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2 border-golden"></div>
            <span className="px-4 text-light-gold font-traditional">OR</span>
            <div className="flex-1 border-t-2 border-golden"></div>
          </div>

          <button
            onClick={handleGoogleSignUp}
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
            Sign up with Google
          </button>

          <p className="text-center text-light-gold mt-6 text-sm">
            Already have an account?{' '}
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

