/**
 * ============================================================================
 * MENU HEADER COMPONENT
 * ============================================================================
 * Hero section with branding and navigation for the menu page.
 * Includes navigation to orders, admin (if applicable), and cart.
 * 
 * Features:
 * - Restaurant branding and tagline
 * - Navigation buttons (Orders, Admin, Cart)
 * - Cart item count badge
 * - Responsive layout
 */

'use client'

import { useRouter } from 'next/navigation'
import { Session } from 'next-auth'

interface MenuHeaderProps {
  /** Current user session */
  session: Session | null
  /** Current cart item count */
  cartItemCount: number
  /** Total items in cart (sum of quantities) */
  cartTotalItems: number
  /** Callback to toggle cart visibility */
  onCartClick: () => void
}

export default function MenuHeader({
  session,
  cartItemCount,
  cartTotalItems,
  onCartClick
}: MenuHeaderProps) {
  const router = useRouter()

  return (
    <>
      {/* Hero Branding Section */}
      <div className="text-center mb-8 sm:mb-12 py-6 sm:py-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold golden-text mb-3 font-traditional drop-shadow-lg">
          SAI DATTA
        </h1>
        <div className="w-16 sm:w-24 h-1 bg-golden mx-auto mb-4"></div>
        <p className="text-light-gold text-2xl sm:text-3xl font-traditional mb-4 sm:mb-6">
          Snacks & Savories
        </p>
        <p className="text-cream max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-traditional px-4">
          Sai Datta Snacks & Savories offers a delightful range of authentic homemade 
          Andhra snacks that are perfect for festive occasions or daily cravings. 
          Discover our quality and taste with every bite.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        {/* My Orders Button */}
        <button
          onClick={() => router.push('/orders')}
          className="bg-golden text-deep-brown px-6 py-3 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-traditional"
        >
          📋 My Orders
        </button>

        {/* Admin Dashboard Button (admin only) */}
        {session?.user?.role === 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="bg-golden text-deep-brown px-6 py-3 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-traditional"
          >
            ⚙️ Admin Dashboard
          </button>
        )}

        {/* Cart Button */}
        <button
          onClick={onCartClick}
          className="bg-golden text-deep-brown px-6 py-3 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-traditional relative"
        >
          🛒 Cart ({cartItemCount})
          
          {/* Item Count Badge */}
          {cartTotalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
              {cartTotalItems}
            </span>
          )}
        </button>
      </div>
    </>
  )
}

