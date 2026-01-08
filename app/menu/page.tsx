/**
 * ============================================================================
 * MENU PAGE
 * ============================================================================
 * Main menu page displaying all product categories with cart functionality.
 * 
 * This component orchestrates:
 * - Product fetching and display
 * - Cart state management
 * - Variant selection for different product types
 * - Navigation to checkout
 * 
 * Component Structure:
 * - MenuHeader: Branding and navigation
 * - CategorySection: Product groups (snacks, sweets, pickles, etc.)
 * - CartSidebar: Cart review and modification
 * - AddToCartConfirmModal: Confirmation before adding items
 * 
 * @see app/menu/components/ for individual component documentation
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Layout Components
import Header from '@/components/Header'
import ContactFooter from '@/components/ContactFooter'

// Menu Components
import {
  MenuHeader,
  CartSidebar,
  AddToCartConfirmModal,
  MainCategorySection,
  SpecialtyCategorySection
} from '@/app/menu/components'

// Types and Utilities
import { Product, CartItem } from '@/types'
import { getQuantityKey, getProductPrice } from '@/lib/hooks/useCart'

// =============================================================================
// COMPONENT
// =============================================================================

export default function MenuPage() {
  // ---------------------------------------------------------------------------
  // HOOKS & STATE
  // ---------------------------------------------------------------------------
  const { data: session } = useSession()
  const router = useRouter()

  // Product state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  // Selection state - tracks user's variant/size choices
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Modal state
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Sync quantities from cart to menu dropdowns
   * This ensures the quantity displayed matches what's in the cart
   */
  useEffect(() => {
    const cartQuantities: Record<string, number> = {}
    cart.forEach((item) => {
      const key = getQuantityKey(item.productId, item.selectedSize || null)
      cartQuantities[key] = item.quantity
    })
    setQuantities(cartQuantities)
  }, [cart])

  /**
   * Initialize on session load:
   * - Redirect to signin if not authenticated
   * - Fetch products
   * - Load cart from localStorage
   */
  useEffect(() => {
    // Wait for session to load
    if (session === undefined) return

    // Redirect if not signed in
    if (!session) {
      router.push('/signin')
      return
    }

    // Fetch products
    fetchProducts()

    // Load saved cart
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch {
        // Silently handle localStorage parse errors
      }
    }
  }, [session, router])

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  /**
   * Fetch all products from API
   */
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // CART OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Check if a product with specific variant is in cart
   */
  const isItemInCart = useCallback((productId: string, variantKey: string | null): boolean => {
    return cart.some(item => item.productId === productId && item.selectedSize === variantKey)
  }, [cart])

  /**
   * Update quantity for a cart item
   */
  const handleQuantityChange = useCallback((
    productId: string,
    variantKey: string | null,
    quantity: number
  ) => {
    setCart((prev) => {
      const newCart = prev.map((item) =>
        item.productId === productId && item.selectedSize === variantKey
          ? { ...item, quantity }
          : item
      )
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
  }, [])

  /**
   * Calculate cart total
   */
  const getTotal = useCallback((): number => {
    return cart.reduce((sum, item) => {
      const price = getProductPrice(item.product, item.selectedSize)
      return sum + price * item.quantity
    }, 0)
  }, [cart])

  // ---------------------------------------------------------------------------
  // ADD TO CART FLOW
  // ---------------------------------------------------------------------------

  /**
   * Handle add button click - validates selection and shows confirmation
   */
  const handleAddButtonClick = (product: Product) => {
    const hasVariants = product.variants && Object.keys(product.variants).length > 0

    // Validate variant selection based on category
    if (hasVariants) {
      if ((product.category === 'snacks' || product.category === 'pickles') && !selectedSizes[product.id]) {
        toast.error('Please select a size first')
        return
      }
      if (product.category === 'sweets' && !selectedVariants[product.id]) {
        toast.error('Please select a variant first')
        return
      }
      if (['biryani', 'mandi', 'curry'].includes(product.category) && !selectedSizes[product.id]) {
        toast.error('Please select a tray size first')
        return
      }
    }

    // Show confirmation modal
    setPendingProduct(product)
    setShowAddToCartModal(true)
  }

  /**
   * Confirm and add product to cart
   */
  const addToCart = (product: Product) => {
    const selectedSize = selectedSizes[product.id] || null
    const selectedVariant = selectedVariants[product.id] || null
    const variantKey = product.category === 'sweets' ? selectedVariant : selectedSize

    setCart((prev) => {
      // Check if same product with same variant exists
      const existing = prev.find(
        (item) => item.productId === product.id && item.selectedSize === variantKey
      )

      const newCart = existing
        ? prev.map((item) =>
            item.productId === product.id && item.selectedSize === variantKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, {
            productId: product.id,
            product,
            quantity: 1,
            selectedSize: variantKey
          }]

      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })

    // Show success message
    const variantText = variantKey ? ` (${variantKey})` : ''
    toast.success(`${product.name}${variantText} added to cart`)

    // Close modal
    setShowAddToCartModal(false)
    setPendingProduct(null)
  }

  // ---------------------------------------------------------------------------
  // SELECTION HANDLERS
  // ---------------------------------------------------------------------------

  const handleSizeSelect = (productId: string, size: string) => {
    setSelectedSizes({ ...selectedSizes, [productId]: size })
  }

  const handleVariantSelect = (productId: string, variant: string) => {
    setSelectedVariants({ ...selectedVariants, [productId]: variant })
  }

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------------------------

  // Group products by category (lowercase for consistency)
  const groupedProducts = (products || []).reduce((acc, product) => {
    const category = product.category.toLowerCase()
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // Cart counts
  const cartItemCount = cart.length
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-golden text-4xl font-traditional font-bold mb-4">SAI DATTA</div>
            <div className="text-cream text-xl">Loading menu...</div>
          </div>
        </div>
      </div>
    )
  }

  // Common props for category sections
  const categoryProps = {
    selectedSizes,
    selectedVariants,
    quantities,
    onSizeSelect: handleSizeSelect,
    onVariantSelect: handleVariantSelect,
    onAddClick: handleAddButtonClick,
    isItemInCart,
    onQuantityChange: handleQuantityChange
  }

  return (
    <div className="min-h-screen textured-bg">
      <Header />
      
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Navigation */}
          <MenuHeader
            session={session}
            cartItemCount={cartItemCount}
            cartTotalItems={cartTotalItems}
            onCartClick={() => setShowCart(!showCart)}
          />

          {/* Main Categories Grid (Snacks & Sweets) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {groupedProducts['snacks'] && (
              <MainCategorySection
                title="Snacks"
                categoryType="snacks"
                products={groupedProducts['snacks']}
                {...categoryProps}
              />
            )}
            {groupedProducts['sweets'] && (
              <MainCategorySection
                title="Sweets"
                categoryType="sweets"
                products={groupedProducts['sweets']}
                {...categoryProps}
              />
            )}
          </div>

          {/* Specialty Categories (Full Width) */}
          {groupedProducts['pickles'] && (
            <SpecialtyCategorySection
              title="Our Specialty - Traditional Pickles"
              categoryType="pickles"
              products={groupedProducts['pickles']}
              {...categoryProps}
            />
          )}

          {groupedProducts['mandi'] && (
            <SpecialtyCategorySection
              title="Mandi"
              categoryType="mandi"
              products={groupedProducts['mandi']}
              {...categoryProps}
            />
          )}

          {(groupedProducts['biryani'] || groupedProducts['Biryani']) && (
            <SpecialtyCategorySection
              title="Biryani"
              categoryType="biryani"
              products={groupedProducts['biryani'] || groupedProducts['Biryani']}
              {...categoryProps}
            />
          )}

          {(groupedProducts['curry'] || groupedProducts['Curry']) && (
            <SpecialtyCategorySection
              title="Curry"
              categoryType="curry"
              products={groupedProducts['curry'] || groupedProducts['Curry']}
              {...categoryProps}
            />
          )}
        </div>
      </div>

      {/* Cart Sidebar Modal */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        setCart={setCart}
        getTotal={getTotal}
      />

      {/* Add to Cart Confirmation Modal */}
      <AddToCartConfirmModal
        isOpen={showAddToCartModal}
        product={pendingProduct}
        selectedSizes={selectedSizes}
        selectedVariants={selectedVariants}
        onCancel={() => {
          setShowAddToCartModal(false)
          setPendingProduct(null)
        }}
        onConfirm={addToCart}
      />

      <ContactFooter />
    </div>
  )
}
