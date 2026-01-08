/**
 * ============================================================================
 * ORDER SUMMARY COMPONENT
 * ============================================================================
 * Displays cart items summary during checkout.
 * Shows item details, prices, special instructions, and total.
 * 
 * Features:
 * - Item list with prices and quantities
 * - Special instructions display/edit button
 * - Delete item button
 * - Running total
 */

'use client'

import { CartItemBasic } from '@/types'

interface OrderSummaryProps {
  /** Cart items to display */
  cart: CartItemBasic[]
  /** Get price for product (considering variant) */
  getProductPrice: (product: CartItemBasic['product'], size?: string | null) => number
  /** Calculate total */
  getTotal: () => number
  /** Callback to open instructions modal */
  onOpenInstructions: (index: number) => void
  /** Callback to delete item */
  onDeleteItem: (index: number) => void
}

export default function OrderSummary({
  cart,
  getProductPrice,
  getTotal,
  onOpenInstructions,
  onDeleteItem
}: OrderSummaryProps) {
  return (
    <div className="border-t-2 border-golden pt-6">
      {/* Section Title */}
      <h2 className="text-2xl md:text-3xl golden-text mb-6 font-traditional font-bold">
        Order Summary
      </h2>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {cart.map((item, index) => {
          const price = getProductPrice(item.product, item.selectedSize)
          const sizeText = item.selectedSize ? ` (${item.selectedSize})` : ''
          const unitText = item.selectedSize || item.product.unit

          return (
            <div
              key={`${item.productId}-${item.selectedSize}-${index}`}
              className="bg-traditional-brown p-4 rounded-xl shadow-md border-2 border-golden border-opacity-30"
            >
              <div className="flex flex-col gap-3">
                {/* Item Details Row */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-cream font-bold text-lg">
                      {item.product.name}{sizeText}
                    </p>
                    <p className="text-light-gold text-sm">
                      {item.quantity} x ${price.toFixed(2)} ({unitText})
                    </p>
                    {/* Special Instructions Display */}
                    {item.specialInstructions && (
                      <p className="text-amber-300 text-sm mt-1 italic">
                        📝 {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  {/* Item Subtotal */}
                  <p className="text-golden font-bold text-xl">
                    ${(price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-golden border-opacity-20">
                  {/* Add/Edit Special Instructions */}
                  <button
                    type="button"
                    onClick={() => onOpenInstructions(index)}
                    className="flex-1 bg-amber-600 text-white py-2.5 px-4 rounded-lg font-bold hover:bg-amber-700 transition-colors font-traditional shadow-md flex items-center justify-center gap-2"
                    title="Add special instructions"
                  >
                    <span className="text-xl">📝</span>
                    <span>{item.specialInstructions ? 'Edit Notes' : 'Add Special Notes'}</span>
                  </button>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onDeleteItem(index)}
                    className="bg-red-600 text-white py-2.5 px-4 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    title="Remove item"
                  >
                    <span className="text-xl">🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total Display */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-golden bg-traditional-brown p-4 rounded-xl">
        <span className="text-light-gold text-xl md:text-2xl font-traditional font-bold">
          Total:
        </span>
        <span className="text-golden text-3xl md:text-4xl font-bold">
          ${getTotal().toFixed(2)}
        </span>
      </div>
    </div>
  )
}

