/**
 * ============================================================================
 * CART SIDEBAR COMPONENT
 * ============================================================================
 * Sliding modal displaying cart contents with quantity controls.
 * Allows users to review, modify, and proceed to checkout.
 * 
 * Features:
 * - Display all cart items with prices
 * - Quantity increment/decrement controls
 * - Variant-aware pricing
 * - Running total calculation
 * - Checkout navigation
 */

'use client'

import { useRouter } from 'next/navigation'
import { CartItem } from '@/types'
import { getProductPrice } from '@/lib/hooks/useCart'

interface CartSidebarProps {
  /** Whether the cart sidebar is visible */
  isOpen: boolean
  /** Callback to close the sidebar */
  onClose: () => void
  /** Current cart items */
  cart: CartItem[]
  /** Callback to update cart state */
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  /** Calculate cart total */
  getTotal: () => number
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  setCart,
  getTotal
}: CartSidebarProps) {
  const router = useRouter()

  /**
   * Decrement item quantity or remove if quantity reaches 0
   */
  const handleDecrement = (productId: string, selectedSize: string | null | undefined) => {
    const itemIndex = cart.findIndex(
      (c) => c.productId === productId && c.selectedSize === selectedSize
    )
    if (itemIndex !== -1) {
      const newCart = [...cart]
      if (newCart[itemIndex].quantity > 1) {
        newCart[itemIndex].quantity -= 1
      } else {
        newCart.splice(itemIndex, 1)
      }
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
    }
  }

  /**
   * Increment item quantity
   */
  const handleIncrement = (productId: string, selectedSize: string | null | undefined) => {
    const itemIndex = cart.findIndex(
      (c) => c.productId === productId && c.selectedSize === selectedSize
    )
    if (itemIndex !== -1) {
      const newCart = [...cart]
      newCart[itemIndex].quantity += 1
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
    }
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-deep-brown traditional-border p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-golden">
          <h2 className="text-3xl golden-text font-traditional font-bold">
            🛒 Your Cart
          </h2>
          <button
            onClick={onClose}
            className="text-light-gold hover:text-golden text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-traditional-brown transition-colors"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Empty Cart State */}
        {cart.length === 0 ? (
          <p className="text-cream text-center py-8">Your cart is empty</p>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="space-y-4 mb-4">
              {cart.map((item, index) => {
                const price = getProductPrice(item.product, item.selectedSize)
                const sizeText = item.selectedSize ? ` (${item.selectedSize})` : ''
                
                return (
                  <div
                    key={`${item.productId}-${item.selectedSize}-${index}`}
                    className="bg-traditional-brown p-4 rounded-xl flex justify-between items-center shadow-md hover:shadow-lg transition-shadow border border-golden border-opacity-20"
                  >
                    {/* Item Info */}
                    <div className="flex-1">
                      <p className="text-cream font-bold">
                        {item.product.name}{sizeText}
                      </p>
                      <p className="text-light-gold text-sm">
                        ${price.toFixed(2)} / {item.selectedSize || item.product.unit}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                      {/* Decrement Button */}
                      <button
                        onClick={() => handleDecrement(item.productId, item.selectedSize)}
                        className="bg-golden text-deep-brown w-9 h-9 rounded-lg font-bold hover:bg-light-gold transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      {/* Quantity Display */}
                      <span className="text-cream w-10 text-center font-bold text-lg">
                        {item.quantity}
                      </span>

                      {/* Increment Button */}
                      <button
                        onClick={() => handleIncrement(item.productId, item.selectedSize)}
                        className="bg-golden text-deep-brown w-9 h-9 rounded-lg font-bold hover:bg-light-gold transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                      {/* Item Subtotal */}
                      <span className="text-golden font-bold ml-4">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart Summary & Checkout */}
            <div className="border-t-2 border-golden pt-6 mb-4 mt-6">
              {/* Total */}
              <div className="flex justify-between items-center mb-6 bg-traditional-brown p-4 rounded-xl">
                <span className="text-light-gold text-xl font-traditional font-bold">
                  Total:
                </span>
                <span className="text-golden text-3xl font-bold">
                  ${getTotal().toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-golden text-deep-brown py-4 rounded-xl font-bold text-lg hover:bg-light-gold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-traditional"
              >
                🛒 Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

