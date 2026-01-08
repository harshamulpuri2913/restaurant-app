/**
 * ============================================================================
 * PRODUCT CARD COMPONENT
 * ============================================================================
 * Individual product display card with variant selection and add-to-cart.
 * Supports different display modes based on product category.
 * 
 * Features:
 * - Product name and price display
 * - Variant/size selection dropdown
 * - Quantity selector (when item is in cart)
 * - Add to cart button
 * - Pre-order badge
 * - Product image/description tooltip
 */

'use client'

import { Product } from '@/types'
import ProductTooltip from '@/components/ProductTooltip'
import { getProductPrice, sortSizeVariants, getQuantityKey } from '@/lib/hooks/useCart'

type ProductCategory = 'snacks' | 'sweets' | 'pickles' | 'biryani' | 'mandi' | 'curry'

interface ProductCardProps {
  /** Product data */
  product: Product
  /** Category type for variant handling */
  category: ProductCategory
  /** Current selected size/tray */
  selectedSize?: string
  /** Current selected variant (for sweets) */
  selectedVariant?: string
  /** Callback when size is selected */
  onSizeSelect: (productId: string, size: string) => void
  /** Callback when variant is selected (for sweets) */
  onVariantSelect: (productId: string, variant: string) => void
  /** Callback when add button is clicked */
  onAddClick: (product: Product) => void
  /** Check if item is in cart */
  isItemInCart: (productId: string, variantKey: string | null) => boolean
  /** Current quantities map */
  quantities: Record<string, number>
  /** Callback to update quantity in cart */
  onQuantityChange: (productId: string, variantKey: string | null, quantity: number) => void
}

export default function ProductCard({
  product,
  category,
  selectedSize,
  selectedVariant,
  onSizeSelect,
  onVariantSelect,
  onAddClick,
  isItemInCart,
  quantities,
  onQuantityChange
}: ProductCardProps) {
  // Check if product has variant options (cast to boolean for type safety)
  const hasVariants = Boolean(product.variants && Object.keys(product.variants).length > 0)

  // Determine which variant is selected based on category
  const currentVariant = category === 'sweets' ? selectedVariant : selectedSize

  // Calculate display price based on selection
  const displayPrice = hasVariants && currentVariant && product.variants?.[currentVariant]
    ? product.variants[currentVariant]
    : product.price
  const displayUnit = hasVariants && currentVariant ? currentVariant : product.unit

  // Check if this product/variant combo is in cart
  const variantKey = currentVariant || null
  const qtyKey = getQuantityKey(product.id, variantKey)
  const inCart = isItemInCart(product.id, variantKey)
  const currentQty = quantities[qtyKey] || 1

  // Determine variant label based on category
  const getVariantLabel = () => {
    switch (category) {
      case 'sweets':
        // Check variant type for sweets
        if (product.variants?.['Each'] || product.variants?.['5 pieces']) {
          return 'Select Pieces:'
        }
        if (product.variants?.['250gm'] || product.variants?.['500gm']) {
          return 'Select Size:'
        }
        return 'Select Variant:'
      case 'biryani':
      case 'mandi':
      case 'curry':
        return 'Select Tray Size:'
      default:
        return 'Select Size:'
    }
  }

  // Determine if we should use sorted variants
  const shouldSortVariants = category !== 'sweets' || 
    (product.variants?.['250gm'] || product.variants?.['500gm'] || product.variants?.['1kg'])

  return (
    <div className="bg-traditional-brown p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-golden border-opacity-20 hover:border-opacity-40 transform hover:-translate-y-1">
      {/* Product Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {/* Product Name Row */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-cream font-bold text-xl pr-[2px]">
              {product.name}
            </h3>
            
            {/* Product Image/Description Tooltip */}
            <ProductTooltip
              image={product.image}
              description={product.description}
              name={product.name}
            />

            {/* Pre-order Badge */}
            {product.preOrderOnly && (
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                Pre-order Only
              </span>
            )}
          </div>

          {/* Price Display */}
          <p className="text-light-gold text-base font-semibold">
            ${displayPrice.toFixed(2)}{' '}
            <span className="text-cream text-sm">/ {displayUnit}</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Quantity Dropdown (shown when item is in cart) */}
          {inCart && (
            <select
              value={currentQty}
              onChange={(e) => onQuantityChange(product.id, variantKey, parseInt(e.target.value))}
              className="px-3 py-2 bg-deep-brown border-2 border-golden rounded-lg text-cream font-bold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                <option key={qty} value={qty}>{qty}</option>
              ))}
            </select>
          )}

          {/* Add Button */}
          <button
            onClick={() => onAddClick(product)}
            disabled={!product.isAvailable || (hasVariants && !currentVariant)}
            className="bg-golden text-deep-brown px-5 py-2.5 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            ➕ Add
          </button>
        </div>
      </div>

      {/* Variant Selector (if product has variants) */}
      {hasVariants && product.variants && (
        <div className="mt-4 pt-3 border-t border-golden border-opacity-20">
          <label className="block text-light-gold text-sm mb-2 font-traditional font-semibold">
            {getVariantLabel()}
          </label>
          <select
            value={currentVariant || ''}
            onChange={(e) => {
              if (category === 'sweets') {
                onVariantSelect(product.id, e.target.value)
              } else {
                onSizeSelect(product.id, e.target.value)
              }
            }}
            className="w-full px-4 py-2.5 bg-deep-brown border-2 border-golden rounded-xl text-cream shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-golden"
          >
            <option value="">Choose {category === 'sweets' ? 'option' : 'size'}...</option>
            {shouldSortVariants
              ? sortSizeVariants(product.variants).map(([variant, price]) => (
                  <option key={variant} value={variant}>
                    {variant} - ${(price as number).toFixed(2)}
                  </option>
                ))
              : Object.entries(product.variants).map(([variant, price]) => (
                  <option key={variant} value={variant}>
                    {variant} - ${(price as number).toFixed(2)}
                  </option>
                ))
            }
          </select>
        </div>
      )}
    </div>
  )
}

