/**
 * ============================================================================
 * ADD TO CART CONFIRMATION MODAL
 * ============================================================================
 * Modal dialog confirming product addition to cart.
 * Shows product name, selected variant, and price before adding.
 * 
 * Purpose:
 * - Prevent accidental cart additions
 * - Confirm variant selection
 * - Display final price for selected variant
 */

'use client'

import { Product } from '@/types'
import { getProductPrice } from '@/lib/hooks/useCart'

interface AddToCartConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** The product to be added */
  product: Product | null
  /** Selected size/variant for snacks, pickles, biryani, mandi, curry */
  selectedSizes: Record<string, string>
  /** Selected variant for sweets */
  selectedVariants: Record<string, string>
  /** Callback when user cancels */
  onCancel: () => void
  /** Callback when user confirms addition */
  onConfirm: (product: Product) => void
}

export default function AddToCartConfirmModal({
  isOpen,
  product,
  selectedSizes,
  selectedVariants,
  onCancel,
  onConfirm
}: AddToCartConfirmModalProps) {
  // Don't render if not open or no product
  if (!isOpen || !product) return null

  // Determine the selected variant based on category
  const selectedSize = selectedSizes[product.id] || null
  const selectedVariant = selectedVariants[product.id] || null
  const variantKey = product.category === 'sweets' ? selectedVariant : selectedSize
  
  // Calculate price for selected variant
  const price = getProductPrice(product, variantKey)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-deep-brown traditional-border p-6 rounded-lg max-w-md w-full">
        <div className="text-center">
          {/* Modal Title */}
          <h3 className="text-2xl golden-text font-traditional mb-4">
            Add to Cart?
          </h3>

          {/* Product Name with Variant */}
          <p className="text-cream text-lg mb-2">
            {product.name}
            {variantKey && ` (${variantKey})`}
          </p>

          {/* Price Display */}
          <p className="text-light-gold text-sm mb-6">
            ${price.toFixed(2)}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="bg-traditional-brown text-cream px-6 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
            >
              Cancel
            </button>

            {/* Confirm Button */}
            <button
              onClick={() => onConfirm(product)}
              className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
            >
              Move to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

