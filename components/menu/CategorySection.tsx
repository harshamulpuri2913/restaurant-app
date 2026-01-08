'use client'

import dynamic from 'next/dynamic'
import ProductCard from './ProductCard'

// Lazy load ProductCard for better performance
const LazyProductCard = dynamic(() => import('./ProductCard'), {
  loading: () => <div className="bg-traditional-brown p-4 rounded-xl animate-pulse h-32" />,
})

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

interface CategorySectionProps {
  title: string
  products: Product[]
  selectedSizes: Record<string, string>
  selectedVariants: Record<string, string>
  quantities: Record<string, number>
  showQuantityDropdown: Record<string, boolean>
  onSizeChange: (productId: string, size: string) => void
  onVariantChange: (productId: string, variant: string) => void
  onQuantityChange: (productId: string, variantKey: string | null, quantity: number) => void
  onAddToCart: (product: Product) => void
  isItemInCart: (productId: string, variantKey: string | null) => boolean
  sortSizeVariants: (variants: Record<string, number>) => [string, number][]
  getQuantityKey: (productId: string, variantKey: string | null) => string
}

export default function CategorySection({
  title,
  products,
  selectedSizes,
  selectedVariants,
  quantities,
  showQuantityDropdown,
  onSizeChange,
  onVariantChange,
  onQuantityChange,
  onAddToCart,
  isItemInCart,
  sortSizeVariants,
  getQuantityKey,
}: CategorySectionProps) {
  if (!products || products.length === 0) {
    return (
      <div className="traditional-border bg-deep-brown p-4 sm:p-6 rounded-2xl shadow-xl">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl golden-text mb-3 font-traditional font-bold">{title}</h2>
          <div className="w-16 sm:w-20 h-1 bg-golden mx-auto"></div>
        </div>
        <p className="text-cream text-center py-4">No {title.toLowerCase()} items available at the moment. Please check back soon! 😊</p>
      </div>
    )
  }

  return (
    <div className="traditional-border bg-deep-brown p-4 sm:p-6 rounded-2xl shadow-xl">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl golden-text mb-3 font-traditional font-bold">{title}</h2>
        <div className="w-16 sm:w-20 h-1 bg-golden mx-auto"></div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {products.map((product) => {
          const variantKey = product.category === 'sweets' 
            ? selectedVariants[product.id] || null
            : selectedSizes[product.id] || null
          const qtyKey = getQuantityKey(product.id, variantKey)
          const inCart = isItemInCart(product.id, variantKey)
          const showDropdown = showQuantityDropdown[qtyKey] || inCart
          const currentQty = quantities[qtyKey] || 1

          return (
            <LazyProductCard
              key={product.id}
              product={product}
              selectedSize={product.category === 'sweets' ? null : selectedSizes[product.id] || null}
              selectedVariant={product.category === 'sweets' ? selectedVariants[product.id] || null : null}
              quantity={currentQty}
              showQuantityDropdown={showDropdown}
              inCart={inCart}
              onSizeChange={(size) => onSizeChange(product.id, size)}
              onVariantChange={(variant) => onVariantChange(product.id, variant)}
              onQuantityChange={(qty) => onQuantityChange(product.id, variantKey, qty)}
              onAddToCart={() => onAddToCart(product)}
              sortSizeVariants={sortSizeVariants}
              getQuantityKey={getQuantityKey}
            />
          )
        })}
      </div>
    </div>
  )
}

