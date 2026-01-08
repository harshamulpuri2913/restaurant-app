'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

/**
 * Loading fallback component for Suspense boundary
 */
function VerifyEmailLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center textured-bg p-4">
            <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
                <div className="text-golden text-2xl mb-4">Loading...</div>
                <div className="text-cream">Please wait</div>
            </div>
        </div>
    )
}

/**
 * Main verification content component
 * Wrapped in Suspense because it uses useSearchParams
 */
function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('loading')
    const [message, setMessage] = useState('')
    const [verificationLink, setVerificationLink] = useState<string | null>(null)
    const token = searchParams.get('token')

    useEffect(() => {
        if (token) {
            verifyToken(token)
        } else {
            setStatus('idle')
            setMessage('No verification token provided')
        }
    }, [token])

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`/api/auth/verify-email?token=${token}`)
            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage('Email verified successfully!')
                toast.success('Email verified!')
                setTimeout(() => {
                    router.push('/menu')
                }, 2000)
            } else {
                setStatus('error')
                setMessage(data.error || 'Verification failed')
                toast.error(data.error || 'Verification failed')
            }
        } catch (error) {
            setStatus('error')
            setMessage('An error occurred. Please try again.')
            toast.error('An error occurred')
        }
    }

    const resendVerification = async () => {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
            })
            const data = await response.json()

            if (response.ok) {
                if (data.verificationLink) {
                    // Development mode - show the link
                    setVerificationLink(data.verificationLink)
                    toast.success('Verification link generated! Click the link below.')
                } else {
                    toast.success(data.message || 'Verification email sent! Please check your inbox.')
                }
            } else {
                toast.error(data.error || 'Failed to send verification email')
            }
        } catch (error) {
            toast.error('An error occurred')
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center textured-bg p-4">
                <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
                    <div className="text-golden text-2xl mb-4">Verifying your email...</div>
                    <div className="text-cream">Please wait</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center textured-bg p-4">
            <div className="w-full max-w-md">
                <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold golden-text mb-2 font-traditional">
                            SAI DATTA
                        </h1>
                        <p className="text-light-gold text-xl font-traditional">
                            Snacks & Savories
                        </p>
                    </div>

                    {status === 'success' && (
                        <div>
                            <div className="text-6xl mb-4">✓</div>
                            <h2 className="text-2xl golden-text mb-4 font-traditional">
                                Email Verified!
                            </h2>
                            <p className="text-cream mb-6">{message}</p>
                            <p className="text-light-gold text-sm">Redirecting to menu...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div className="text-6xl mb-4 text-red-400">✗</div>
                            <h2 className="text-2xl text-red-400 mb-4 font-traditional">
                                Verification Failed
                            </h2>
                            <p className="text-cream mb-6">{message}</p>
                            {session && (
                                <>
                                    <button
                                        onClick={resendVerification}
                                        className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional mb-4"
                                    >
                                        Resend Verification Email
                                    </button>
                                    {verificationLink && (
                                        <div className="mt-4 p-4 bg-traditional-brown rounded-lg border-2 border-golden">
                                            <p className="text-light-gold text-sm mb-2 font-traditional">
                                                Email service not configured. Use this link to verify:
                                            </p>
                                            <a
                                                href={verificationLink}
                                                className="text-golden hover:text-light-gold underline break-all text-sm font-traditional"
                                            >
                                                {verificationLink}
                                            </a>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {status === 'idle' && (
                        <div>
                            <h2 className="text-2xl golden-text mb-4 font-traditional">
                                Email Verification
                            </h2>
                            <p className="text-cream mb-6">
                                {session
                                    ? 'Check your email for the verification link, or resend it below.'
                                    : 'Please sign in to verify your email.'}
                            </p>
                            {session && (
                                <>
                                    <button
                                        onClick={resendVerification}
                                        className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional mb-4"
                                    >
                                        Resend Verification Email
                                    </button>
                                    {verificationLink && (
                                        <div className="mt-4 p-4 bg-traditional-brown rounded-lg border-2 border-golden">
                                            <p className="text-light-gold text-sm mb-2 font-traditional">
                                                Email service not configured. Use this link to verify:
                                            </p>
                                            <a
                                                href={verificationLink}
                                                className="text-golden hover:text-light-gold underline break-all text-sm font-traditional"
                                            >
                                                {verificationLink}
                                            </a>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-8">
                        <a
                            href="/menu"
                            className="text-golden hover:text-light-gold font-traditional underline"
                        >
                            Go to Menu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Verify Email Page
 * Handles email verification via token from URL
 * Wrapped in Suspense boundary for useSearchParams
 */
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailLoading />}>
            <VerifyEmailContent />
        </Suspense>
    )
}
