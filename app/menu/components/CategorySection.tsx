/**
 * ============================================================================
 * CATEGORY SECTION COMPONENT
 * ============================================================================
 * Container component for displaying a group of products in a category.
 * Provides consistent styling and layout for each menu section.
 * 
 * Features:
 * - Category title with decorative underline
 * - Grid or list layout for products
 * - Empty state handling
 * - Responsive design
 */

'use client'

import { ReactNode } from 'react'
import { Product } from '@/types'
import ProductCard from './ProductCard'

type CategoryType = 'snacks' | 'sweets' | 'pickles' | 'biryani' | 'mandi' | 'curry'

interface CategorySectionProps {
  /** Category title to display */
  title: string
  /** Category type for styling and variant handling */
  categoryType: CategoryType
  /** Products to display */
  products: Product[]
  /** Selected sizes map */
  selectedSizes: Record<string, string>
  /** Selected variants map (for sweets) */
  selectedVariants: Record<string, string>
  /** Quantities map */
  quantities: Record<string, number>
  /** Callback when size is selected */
  onSizeSelect: (productId: string, size: string) => void
  /** Callback when variant is selected */
  onVariantSelect: (productId: string, variant: string) => void
  /** Callback when add button is clicked */
  onAddClick: (product: Product) => void
  /** Check if item is in cart */
  isItemInCart: (productId: string, variantKey: string | null) => boolean
  /** Callback to update quantity */
  onQuantityChange: (productId: string, variantKey: string | null, quantity: number) => void
  /** Optional custom layout - 'grid' for 2 columns, 'list' for single column */
  layout?: 'grid' | 'list'
  /** Optional empty state message */
  emptyMessage?: string
  /** Whether to show this section at full width */
  fullWidth?: boolean
}

export default function CategorySection({
  title,
  categoryType,
  products,
  selectedSizes,
  selectedVariants,
  quantities,
  onSizeSelect,
  onVariantSelect,
  onAddClick,
  isItemInCart,
  onQuantityChange,
  layout = 'list',
  emptyMessage,
  fullWidth = false
}: CategorySectionProps) {
  // Handle empty products
  const hasProducts = products && products.length > 0

  return (
    <div className={`traditional-border bg-deep-brown p-4 sm:p-6 rounded-2xl shadow-xl ${fullWidth ? 'mt-8' : ''}`}>
      {/* Section Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl golden-text mb-3 font-traditional font-bold">
          {title}
        </h2>
        <div className="w-16 sm:w-20 h-1 bg-golden mx-auto"></div>
      </div>

      {/* Products Display */}
      {hasProducts ? (
        <div className={
          layout === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
            : 'space-y-3 sm:space-y-4'
        }>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              category={categoryType}
              selectedSize={selectedSizes[product.id]}
              selectedVariant={selectedVariants[product.id]}
              onSizeSelect={onSizeSelect}
              onVariantSelect={onVariantSelect}
              onAddClick={onAddClick}
              isItemInCart={isItemInCart}
              quantities={quantities}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <p className="text-cream text-center py-4">
          {emptyMessage || `No ${title.toLowerCase()} items available at the moment. Please check back soon! 😊`}
        </p>
      )}
    </div>
  )
}

/**
 * Simplified section for categories displayed in the main grid
 * (snacks and sweets - displayed side by side)
 */
export function MainCategorySection(props: CategorySectionProps) {
  return <CategorySection {...props} layout="list" />
}

/**
 * Full-width section for specialty categories
 * (biryani, mandi, curry, pickles - displayed at full width with grid)
 */
export function SpecialtyCategorySection(props: Omit<CategorySectionProps, 'layout' | 'fullWidth'>) {
  return <CategorySection {...props} layout="grid" fullWidth />
}

