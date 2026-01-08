'use client'

import { useState } from 'react'
import ProductTooltip from '../ProductTooltip'

interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
  isAvailable: boolean
  preOrderOnly?: boolean
  image?: string | null
  description?: string | null
  variants?: Record<string, number> | null
}

interface ProductCardProps {
  product: Product
  selectedSize: string | null
  selectedVariant: string | null
  quantity: number
  showQuantityDropdown: boolean
  inCart: boolean
  onSizeChange: (size: string) => void
  onVariantChange: (variant: string) => void
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  sortSizeVariants: (variants: Record<string, number>) => [string, number][]
  getQuantityKey: (productId: string, variantKey: string | null) => string
}

export default function ProductCard({
  product,
  selectedSize,
  selectedVariant,
  quantity,
  showQuantityDropdown,
  inCart,
  onSizeChange,
  onVariantChange,
  onQuantityChange,
  onAddToCart,
  sortSizeVariants,
  getQuantityKey,
}: ProductCardProps) {
  const hasVariants = product.variants && Object.keys(product.variants).length > 0
  const variantKey = product.category === 'sweets' ? selectedVariant : selectedSize
  const displayPrice = hasVariants && variantKey && product.variants?.[variantKey]
    ? product.variants[variantKey]
    : product.price
  const displayUnit = hasVariants && variantKey ? variantKey : product.unit

  // Determine if variants are pieces or size
  const isPiecesVariant = hasVariants && product.variants && (
    product.variants['Each'] || product.variants['5 pieces'] || product.variants['10 pieces']
  )
  const isSizeVariant = hasVariants && product.variants && (
    product.variants['250gm'] || product.variants['500gm'] || product.variants['1kg']
  )

  return (
    <div className="bg-traditional-brown p-4 sm:p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-golden border-opacity-20 hover:border-opacity-40 transform hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-cream font-bold text-lg sm:text-xl pr-[2px]">{product.name}</h3>
            <ProductTooltip
              image={product.image}
              description={product.description}
              name={product.name}
            />
            {product.preOrderOnly && (
              <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                Pre-order Only
              </span>
            )}
          </div>
          <p className="text-light-gold text-base font-semibold">
            ${displayPrice.toFixed(2)} <span className="text-cream text-sm">/ {displayUnit}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {showQuantityDropdown && (
            <select
              value={quantity}
              onChange={(e) => {
                const newQty = parseInt(e.target.value)
                onQuantityChange(newQty)
              }}
              className="px-4 py-2 bg-deep-brown border-2 border-golden rounded-xl text-cream font-bold shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-golden"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                <option key={qty} value={qty}>{qty}</option>
              ))}
            </select>
          )}
          <button
            onClick={onAddToCart}
            disabled={!product.isAvailable || (hasVariants ? !variantKey : false)}
            className="bg-golden text-deep-brown px-5 py-2.5 rounded-xl font-bold hover:bg-light-gold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            ➕ Add
          </button>
        </div>
      </div>
      {hasVariants && product.variants && (
        <div className="mt-4 pt-3 border-t border-golden border-opacity-20">
          <label className="block text-light-gold text-sm mb-2 font-traditional font-semibold">
            {product.category === 'sweets' 
              ? (isPiecesVariant ? 'Select Pieces:' : isSizeVariant ? 'Select Size:' : 'Select Variant:')
              : product.category === 'biryani' || product.category === 'mandi' || product.category === 'curry'
              ? 'Select Tray Size:'
              : 'Select Size:'}
          </label>
          <select
            value={variantKey || ''}
            onChange={(e) => {
              if (product.category === 'sweets') {
                onVariantChange(e.target.value)
              } else {
                onSizeChange(e.target.value)
              }
            }}
            className="w-full px-4 py-2.5 bg-deep-brown border-2 border-golden rounded-xl text-cream shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-golden"
          >
            <option value="">Choose {product.category === 'sweets' ? 'option' : product.category === 'biryani' || product.category === 'mandi' || product.category === 'curry' ? 'tray size' : 'size'}...</option>
            {isSizeVariant && product.category === 'sweets'
              ? sortSizeVariants(product.variants).map(([variant, price]) => (
                  <option key={variant} value={variant}>
                    {variant} - ${(price as number).toFixed(2)}
                  </option>
                ))
              : product.category === 'sweets'
              ? Object.entries(product.variants).map(([variant, price]) => (
                  <option key={variant} value={variant}>
                    {variant} - ${(price as number).toFixed(2)}
                  </option>
                ))
              : sortSizeVariants(product.variants).map(([size, price]) => (
                  <option key={size} value={size}>
                    {size} - ${(price as number).toFixed(2)}
                  </option>
                ))}
          </select>
        </div>
      )}
    </div>
  )
}

