/**
 * ============================================================================
 * HEADER COMPONENT
 * ============================================================================
 * Application header displaying branding and user information.
 * 
 * Features:
 * - Shows user name when authenticated
 * - Sign out functionality
 * - Navigation menu button on checkout page
 * 
 * @component
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  /**
   * Handle sign out
   * Clears session and redirects to sign-in
   */
  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/signin')
  }

  // Don't show header on signin/signup pages
  if (pathname === '/signin' || pathname === '/signup' || pathname === '/verify-email') {
    return null
  }

  return (
    <div className="bg-deep-brown border-b-2 border-golden p-3 sm:p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 sm:gap-4">
        <div className="text-xl sm:text-2xl golden-text font-traditional font-bold">
          SAI DATTA
        </div>
        {status === 'loading' ? (
          <div className="text-cream text-sm sm:text-base">Loading...</div>
        ) : session ? (
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-cream text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
              {session.user?.name || session.user?.email}
            </span>
            {pathname === '/checkout' && (
              <button
                onClick={() => router.push('/menu')}
                className="bg-traditional-brown text-cream px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold hover:bg-opacity-80 transition-all duration-300 shadow-md hover:shadow-lg font-traditional text-xs sm:text-sm"
              >
                Menu
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="bg-golden text-deep-brown px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-md hover:shadow-lg font-traditional text-xs sm:text-sm"
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

