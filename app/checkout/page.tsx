/**
 * ============================================================================
 * CHECKOUT PAGE
 * ============================================================================
 * Order finalization page where customers confirm their order details.
 * 
 * This page provides:
 * - Customer information form (name, email, phone, pickup location - all mandatory)
 * - Order summary with item management
 * - Special instructions per item
 * - High amount warning for orders over $100
 * 
 * Requires authentication - only logged-in users can access checkout
 * 
 * Component Structure:
 * - CustomerForm: Customer info collection
 * - OrderSummary: Cart items review
 * - HighAmountModal: Warning for large orders
 * - SpecialInstructionsModal: Item-specific notes
 * - DeleteConfirmModal: Item removal confirmation
 * 
 * @see app/checkout/components/ for individual component documentation
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

// Layout Components
const Header = dynamic(() => import('@/components/Header'), { ssr: true })
const ContactFooter = dynamic(() => import('@/components/ContactFooter'), { ssr: true })

// Shared Components
import SpecialInstructionsModal from '@/components/SpecialInstructionsModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

// Checkout Components
import {
  CustomerForm,
  OrderSummary,
  HighAmountModal,
  validateEmail
} from './components'

// Types
import { CustomerInfo, CartItemBasic } from '@/types'

// =============================================================================
// COMPONENT
// =============================================================================

export default function CheckoutPage() {
  // ---------------------------------------------------------------------------
  // HOOKS & STATE
  // ---------------------------------------------------------------------------
  const { data: session, status } = useSession()
  const router = useRouter()

  // Cart state
  const [cart, setCart] = useState<CartItemBasic[]>([])

  // Customer info state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: session?.user?.email || '',
    location: '',
    pickupDate: '',
  })

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCount, setOrderCount] = useState(0)

  // Modal state
  const [showHighAmountModal, setShowHighAmountModal] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Load cart from localStorage on mount
   */
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Failed to load cart from localStorage')
      }
    }
  }, [])

  /**
   * Pre-fill customer info from session
   */
  useEffect(() => {
    if (session?.user?.name && !customerInfo.name) {
      setCustomerInfo(prev => ({ ...prev, name: session.user.name || '' }))
    }
    if (session?.user?.email && !customerInfo.email) {
      setCustomerInfo(prev => ({ ...prev, email: session.user.email || '' }))
    }
  }, [session, customerInfo.name, customerInfo.email])

  /**
   * Initialize checkout - auth check, cart load, order count
   * Only authenticated users can access checkout
   */
  useEffect(() => {
    if (status === 'loading') return

    // Redirect if not authenticated
    if (!session) {
      router.push('/signin')
      return
    }

    // Authenticated user - proceed normally
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    } else {
      router.push('/menu')
    }

    fetchOrderCount()
  }, [session, status, router])

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  /**
   * Fetch user's order count for personalized messaging
   */
  const fetchOrderCount = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const orders = await res.json()
        setOrderCount(orders.length)
      }
    } catch (error) {
      // Silently fail - not critical
    }
  }

  // ---------------------------------------------------------------------------
  // PRICE CALCULATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get price for product considering selected variant
   */
  const getProductPrice = (product: CartItemBasic['product'], size?: string | null): number => {
    if (product.variants && size && product.variants[size]) {
      return product.variants[size]
    }
    return product.price
  }

  /**
   * Calculate cart total
   */
  const getTotal = (): number => {
    return cart.reduce((sum, item) => {
      const price = getProductPrice(item.product, item.selectedSize)
      return sum + price * item.quantity
    }, 0)
  }

  // ---------------------------------------------------------------------------
  // FORM SUBMISSION
  // ---------------------------------------------------------------------------

  /**
   * Handle form submission
   * Validates all required fields and shows high amount warning if needed
   * 
   * Required fields for all orders:
   * - Full Name
   * - Email (must end with .com)
   * - Phone (10 digits)
   * - Pickup Location
   * 
   * Additional requirement:
   * - Pickup Date (required for biryani orders)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate full name
    if (!customerInfo.name || !customerInfo.name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    // Validate email
    if (!customerInfo.email || !customerInfo.email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    if (!validateEmail(customerInfo.email)) {
      toast.error('Please enter a valid email address ending with .com')
      return
    }

    // Validate phone
    if (!customerInfo.phone || customerInfo.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    // Validate pickup location (mandatory for all orders)
    if (!customerInfo.location || !customerInfo.location.trim()) {
      toast.error('Please select a pickup location')
      return
    }

    // Check for high amount
    const total = getTotal()
    if (total > 100) {
      setShowHighAmountModal(true)
      return
    }

    await createOrder()
  }

  /**
   * Create the order via API
   */
  const createOrder = async () => {
    setIsSubmitting(true)

    try {
      // Validate biryani orders
      if (hasBiryani && !customerInfo.pickupDate) {
        toast.error('Please select a pickup date for biryani orders')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
            specialInstructions: item.specialInstructions || null,
          })),
          customerInfo,
          location: customerInfo.location,
          pickupDate: customerInfo.pickupDate || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create order')

      // Clear cart
      localStorage.removeItem('cart')

      // Show success message with personalization
      const total = getTotal()
      let message = 'Order created successfully! Sai Datta Foods will confirm your order.'

      if (total > 100) {
        message = `🎉🎊 Thank you for your generous order! We truly appreciate your business! 🎉🎊\n\n${message}`
      } else if (orderCount > 0) {
        message = `😊 Thank you for ordering with us again! We're happy to serve you! 😊\n\n${message}`
      }

      toast.success(message, { duration: 5000 })
      router.push('/orders')
    } catch (error) {
      toast.error('Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
      setShowHighAmountModal(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ITEM MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Open special instructions modal for an item
   */
  const handleOpenInstructionsModal = (index: number) => {
    setSelectedItemIndex(index)
    setShowInstructionsModal(true)
  }

  /**
   * Save special instructions for an item
   */
  const handleSaveInstructions = (instructions: string) => {
    if (selectedItemIndex !== null) {
      const newCart = [...cart]
      newCart[selectedItemIndex].specialInstructions = instructions || undefined
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
      toast.success(instructions ? 'Special instructions saved' : 'Special instructions removed')
    }
  }

  /**
   * Initiate item deletion (show confirmation)
   */
  const handleDeleteClick = (index: number) => {
    setItemToDelete(index)
    setShowDeleteConfirm(true)
  }

  /**
   * Confirm and execute item deletion
   */
  const confirmDelete = () => {
    if (itemToDelete !== null) {
      const newCart = cart.filter((_, i) => i !== itemToDelete)
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
      toast.success('Item removed from cart')
      if (newCart.length === 0) {
        router.push('/menu')
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------------------------

  const hasBiryani = cart.some(item => item.product.category === 'biryani')

  // ---------------------------------------------------------------------------
  // RENDER - Loading States
  // ---------------------------------------------------------------------------

  if (status === 'loading') {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-golden text-2xl">Loading...</div>
        </div>
      </div>
    )
  }

  // Only authenticated users can access checkout

  if (cart.length === 0) {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-golden text-xl mb-4">Your cart is empty</p>
            <button
              onClick={() => router.push('/menu')}
              className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER - Main Content
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen textured-bg">
      <Header />
      <div className="p-4">
        <div className="max-w-3xl mx-auto">
          <div className="traditional-border bg-deep-brown p-8 rounded-lg">
            {/* Page Title */}
            <h1 className="text-4xl golden-text mb-8 font-traditional text-center">
              Checkout
            </h1>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <CustomerForm
                customerInfo={customerInfo}
                hasBiryani={hasBiryani}
                onChange={setCustomerInfo}
              />

              {/* Order Summary */}
              <OrderSummary
                cart={cart}
                getProductPrice={getProductPrice}
                getTotal={getTotal}
                onOpenInstructions={handleOpenInstructionsModal}
                onDeleteItem={handleDeleteClick}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-golden text-deep-brown py-4 rounded-xl font-bold text-xl hover:bg-light-gold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-traditional"
              >
                {isSubmitting ? 'Creating Order...' : '🛒 Create Order'}
              </button>
            </form>

            {/* Delete Confirmation Modal */}
            {itemToDelete !== null && (
              <DeleteConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                  setShowDeleteConfirm(false)
                  setItemToDelete(null)
                }}
                onConfirm={confirmDelete}
                itemName={cart[itemToDelete].product.name + (cart[itemToDelete].selectedSize ? ` (${cart[itemToDelete].selectedSize})` : '')}
              />
            )}

            {/* High Amount Warning Modal */}
            <HighAmountModal
              isOpen={showHighAmountModal}
              total={getTotal()}
              onClose={() => setShowHighAmountModal(false)}
              onProceed={createOrder}
            />

            {/* Special Instructions Modal */}
            {selectedItemIndex !== null && (
              <SpecialInstructionsModal
                isOpen={showInstructionsModal}
                onClose={() => {
                  setShowInstructionsModal(false)
                  setSelectedItemIndex(null)
                }}
                onSave={handleSaveInstructions}
                productName={cart[selectedItemIndex].product.name + (cart[selectedItemIndex].selectedSize ? ` (${cart[selectedItemIndex].selectedSize})` : '')}
                currentInstructions={cart[selectedItemIndex].specialInstructions}
              />
            )}
          </div>
        </div>
      </div>
      <ContactFooter />
    </div>
  )
}
