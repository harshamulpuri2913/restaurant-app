'use client'

interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
  variants?: Record<string, number> | null
}

interface AddToCartModalProps {
  show: boolean
  product: Product | null
  selectedSize: string | null
  selectedVariant: string | null
  onConfirm: () => void
  onCancel: () => void
  getProductPrice: (product: Product, size?: string | null) => number
}

export default function AddToCartModal({
  show,
  product,
  selectedSize,
  selectedVariant,
  onConfirm,
  onCancel,
  getProductPrice,
}: AddToCartModalProps) {
  if (!show || !product) return null

  const variantKey = product.category === 'sweets' ? selectedVariant : selectedSize
  const price = getProductPrice(product, variantKey)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-deep-brown traditional-border p-6 rounded-lg max-w-md w-full">
        <div className="text-center">
          <h3 className="text-2xl golden-text font-traditional mb-4">
            Add to Cart?
          </h3>
          <p className="text-cream text-lg mb-2">
            {product.name}
            {variantKey ? ` (${variantKey})` : ''}
          </p>
          <p className="text-light-gold text-sm mb-6">
            ${price.toFixed(2)}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onCancel}
              className="bg-traditional-brown text-cream px-6 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
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

