'use client'

import { useRouter } from 'next/navigation'

interface CartItem {
  productId: string
  product: {
    id: string
    name: string
    price: number
    unit: string
    category?: string
    variants?: Record<string, number> | null
  }
  quantity: number
  selectedSize?: string | null
}

interface CartModalProps {
  cart: CartItem[]
  showCart: boolean
  onClose: () => void
  onUpdateQuantity: (productId: string, selectedSize: string | null, newQuantity: number) => void
  onRemoveItem: (productId: string, selectedSize: string | null) => void
  getProductPrice: (product: CartItem['product'], size?: string | null) => number
  getTotal: () => number
}

export default function CartModal({
  cart,
  showCart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  getProductPrice,
  getTotal,
}: CartModalProps) {
  const router = useRouter()

  if (!showCart) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-deep-brown traditional-border p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-golden">
          <h2 className="text-3xl golden-text font-traditional font-bold">🛒 Your Cart</h2>
          <button
            onClick={onClose}
            className="text-light-gold hover:text-golden text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-traditional-brown transition-colors"
          >
            ✕
          </button>
        </div>
        {cart.length === 0 ? (
          <p className="text-cream text-center py-8">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              {cart.map((item, index) => {
                const price = getProductPrice(item.product, item.selectedSize)
                const sizeText = item.selectedSize ? ` (${item.selectedSize})` : ''
                return (
                  <div
                    key={`${item.productId}-${item.selectedSize}-${index}`}
                    className="bg-traditional-brown p-4 rounded-xl flex justify-between items-center shadow-md hover:shadow-lg transition-shadow border border-golden border-opacity-20"
                  >
                    <div className="flex-1">
                      <p className="text-cream font-bold">{item.product.name}{sizeText}</p>
                      <p className="text-light-gold text-sm">
                        ${price.toFixed(2)} / {item.selectedSize || item.product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const itemIndex = cart.findIndex(
                            (c) => c.productId === item.productId && c.selectedSize === item.selectedSize
                          )
                          if (itemIndex !== -1) {
                            const newCart = [...cart]
                            if (newCart[itemIndex].quantity > 1) {
                              onUpdateQuantity(item.productId, item.selectedSize || null, newCart[itemIndex].quantity - 1)
                            } else {
                              onRemoveItem(item.productId, item.selectedSize || null)
                            }
                          }
                        }}
                        className="bg-golden text-deep-brown w-9 h-9 rounded-lg font-bold hover:bg-light-gold transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                      >
                        −
                      </button>
                      <span className="text-cream w-10 text-center font-bold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const itemIndex = cart.findIndex(
                            (c) => c.productId === item.productId && c.selectedSize === item.selectedSize
                          )
                          if (itemIndex !== -1) {
                            const newCart = [...cart]
                            onUpdateQuantity(item.productId, item.selectedSize || null, newCart[itemIndex].quantity + 1)
                          }
                        }}
                        className="bg-golden text-deep-brown w-9 h-9 rounded-lg font-bold hover:bg-light-gold transition-all shadow-md hover:shadow-lg transform hover:scale-110"
                      >
                        +
                      </button>
                      <span className="text-golden font-bold ml-4">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t-2 border-golden pt-6 mb-4 mt-6">
              <div className="flex justify-between items-center mb-6 bg-traditional-brown p-4 rounded-xl">
                <span className="text-light-gold text-xl font-traditional font-bold">Total:</span>
                <span className="text-golden text-2xl font-bold">
                  ${getTotal().toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => {
                  onClose()
                  router.push('/checkout')
                }}
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

