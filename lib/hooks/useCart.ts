/**
 * ============================================================================
 * USE CART HOOK
 * ============================================================================
 * Custom hook for managing shopping cart state and operations.
 * Handles cart persistence, item management, and total calculations.
 * 
 * Features:
 * - Local storage persistence
 * - Add/remove/update cart items
 * - Variant-aware price calculations
 * - Cart totals
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, CartItem } from '@/types'

const CART_STORAGE_KEY = 'cart'

/**
 * Generate a unique key for product + variant combination
 * Used to track quantities for specific product variants
 */
export const getQuantityKey = (productId: string, variantKey: string | null): string => {
  return `${productId}-${variantKey || 'default'}`
}

/**
 * Get the price for a product, considering selected variant
 * @param product - The product object
 * @param size - Selected size/variant (optional)
 * @returns The appropriate price
 */
export const getProductPrice = (product: Product, size?: string | null): number => {
  if (product.variants && size && product.variants[size]) {
    return product.variants[size]
  }
  return product.price
}

/**
 * Sort size variants from largest to smallest
 * Handles common weight and quantity formats
 */
export const sortSizeVariants = (variants: Record<string, number>): [string, number][] => {
  const sizeOrder: Record<string, number> = {
    '1kg': 1000,
    '500gm': 500,
    '500g': 500,
    '250gm': 250,
    '250g': 250,
    'full tray': 3,
    'half tray': 2,
    'family pack': 1,
  }

  return Object.entries(variants).sort(([a], [b]) => {
    const aValue = sizeOrder[a.toLowerCase()] || 0
    const bValue = sizeOrder[b.toLowerCase()] || 0
    return bValue - aValue // Descending order (largest first)
  })
}

interface UseCartReturn {
  /** Current cart items */
  cart: CartItem[]
  /** Set entire cart (for direct manipulation) */
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  /** Add item to cart */
  addToCart: (product: Product, variantKey: string | null) => void
  /** Remove item from cart */
  removeFromCart: (productId: string, selectedSize?: string | null) => void
  /** Update item quantity */
  updateQuantity: (productId: string, quantity: number, selectedSize?: string | null) => void
  /** Increment item quantity */
  incrementQuantity: (productId: string, selectedSize?: string | null) => void
  /** Decrement item quantity (removes if qty becomes 0) */
  decrementQuantity: (productId: string, selectedSize?: string | null) => void
  /** Check if item is in cart */
  isItemInCart: (productId: string, variantKey: string | null) => boolean
  /** Get cart total */
  getTotal: () => number
  /** Get item quantity */
  getItemQuantity: (productId: string, variantKey: string | null) => number
  /** Clear entire cart */
  clearCart: () => void
  /** Cart item count (total quantity of all items) */
  itemCount: number
  /** Number of unique items in cart */
  uniqueItemCount: number
}

/**
 * Custom hook for cart management
 * @returns Cart state and manipulation functions
 */
export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartItem[]>([])

  /**
   * Load cart from localStorage on mount
   */
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      } catch (e) {
        // Silently handle localStorage parse errors
      }
    }
  }, [])

  /**
   * Save cart to localStorage whenever it changes
   */
  const saveCart = useCallback((newCart: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
  }, [])

  /**
   * Add a product to cart
   */
  const addToCart = useCallback((product: Product, variantKey: string | null) => {
    setCart((prev) => {
      // Check if same product with same variant already exists
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.selectedSize === variantKey
      )

      let newCart: CartItem[]

      if (existingIndex !== -1) {
        // Increment quantity if already in cart
        newCart = prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item
        newCart = [...prev, {
          productId: product.id,
          product,
          quantity: 1,
          selectedSize: variantKey
        }]
      }

      saveCart(newCart)
      return newCart
    })
  }, [saveCart])

  /**
   * Remove an item from cart
   */
  const removeFromCart = useCallback((productId: string, selectedSize?: string | null) => {
    setCart((prev) => {
      const newCart = prev.filter(
        (item) => !(item.productId === productId && item.selectedSize === selectedSize)
      )
      saveCart(newCart)
      return newCart
    })
  }, [saveCart])

  /**
   * Update quantity for a specific item
   */
  const updateQuantity = useCallback((
    productId: string,
    quantity: number,
    selectedSize?: string | null
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize)
      return
    }

    setCart((prev) => {
      const newCart = prev.map((item) =>
        item.productId === productId && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      )
      saveCart(newCart)
      return newCart
    })
  }, [removeFromCart, saveCart])

  /**
   * Increment quantity by 1
   */
  const incrementQuantity = useCallback((productId: string, selectedSize?: string | null) => {
    setCart((prev) => {
      const item = prev.find(
        (i) => i.productId === productId && i.selectedSize === selectedSize
      )
      if (item) {
        return prev.map((i) =>
          i.productId === productId && i.selectedSize === selectedSize
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return prev
    })
  }, [])

  /**
   * Decrement quantity by 1 (removes if reaches 0)
   */
  const decrementQuantity = useCallback((productId: string, selectedSize?: string | null) => {
    setCart((prev) => {
      const item = prev.find(
        (i) => i.productId === productId && i.selectedSize === selectedSize
      )
      if (!item) return prev

      if (item.quantity <= 1) {
        const newCart = prev.filter(
          (i) => !(i.productId === productId && i.selectedSize === selectedSize)
        )
        saveCart(newCart)
        return newCart
      }

      const newCart = prev.map((i) =>
        i.productId === productId && i.selectedSize === selectedSize
          ? { ...i, quantity: i.quantity - 1 }
          : i
      )
      saveCart(newCart)
      return newCart
    })
  }, [saveCart])

  /**
   * Check if an item is in the cart
   */
  const isItemInCart = useCallback((productId: string, variantKey: string | null): boolean => {
    return cart.some(item => item.productId === productId && item.selectedSize === variantKey)
  }, [cart])

  /**
   * Get the quantity of a specific item in cart
   */
  const getItemQuantity = useCallback((productId: string, variantKey: string | null): number => {
    const item = cart.find(
      (i) => i.productId === productId && i.selectedSize === variantKey
    )
    return item?.quantity || 0
  }, [cart])

  /**
   * Calculate cart total
   */
  const getTotal = useCallback((): number => {
    return cart.reduce((sum, item) => {
      const price = getProductPrice(item.product, item.selectedSize)
      return sum + price * item.quantity
    }, 0)
  }, [cart])

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setCart([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  // Calculate derived values
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueItemCount = cart.length

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    isItemInCart,
    getTotal,
    getItemQuantity,
    clearCart,
    itemCount,
    uniqueItemCount
  }
}

export default useCart

