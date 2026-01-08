'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function VerificationBanner() {
  const { data: session } = useSession()
  const [isResending, setIsResending] = useState(false)

  if (!session?.user || session.user.emailVerified) {
    return null
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-600 border-b-2 border-yellow-400 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">⚠️</span>
          <span className="text-white">
            Please verify your email address. Check your inbox for the verification link.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/verify-email"
            className="text-white underline hover:text-yellow-200 font-traditional"
          >
            Verify Now
          </a>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="bg-white text-yellow-600 px-4 py-1 rounded font-bold hover:bg-yellow-50 transition-colors disabled:opacity-50 font-traditional text-sm"
          >
            {isResending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      </div>
    </div>
  )
}


