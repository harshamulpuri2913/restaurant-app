/**
 * ============================================================================
 * ORDER ITEMS LIST COMPONENT
 * ============================================================================
 * Displays the list of items in an order with optional price editing.
 * Used in the expanded order view in admin dashboard.
 * 
 * Features:
 * - Display item name, quantity, price, subtotal
 * - Special instructions display
 * - Price editing mode with save/cancel
 * - Real-time subtotal calculation during edit
 * - Delete item functionality for pending/processing orders
 */

'use client'

import { OrderItem } from '@/types'

interface OrderItemsListProps {
  /** Items in the order */
  items: OrderItem[]
  /** Order ID for editing */
  orderId: string
  /** Current order status */
  orderStatus: string
  /** Whether price editing is active */
  isEditing: boolean
  /** Current edited prices map */
  itemPrices: Record<string, number>
  /** Callback when editing mode is toggled */
  onEditClick: () => void
  /** Callback when price changes */
  onPriceChange: (itemId: string, price: number) => void
  /** Callback when prices are saved */
  onSavePrices: () => void
  /** Callback when editing is cancelled */
  onCancelEdit: () => void
  /** Callback when delete is clicked on an item */
  onDeleteClick: (item: OrderItem) => void
}

export default function OrderItemsList({
  items,
  orderId,
  orderStatus,
  isEditing,
  itemPrices,
  onEditClick,
  onPriceChange,
  onSavePrices,
  onCancelEdit,
  onDeleteClick
}: OrderItemsListProps) {
  /**
   * Check if item deletion is allowed based on order status
   * Only pending and processing orders can have items deleted
   */
  const canDeleteItems = ['pending', 'processing'].includes(orderStatus)

  return (
    <>
      {/* Section Header with Edit Button */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xl golden-text font-traditional">Items:</h4>
        {!isEditing && (
          <button
            onClick={onEditClick}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700"
          >
            ✏️ Edit Prices
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-traditional-brown p-3 rounded-lg flex justify-between items-center"
          >
            {/* Item Details */}
            <div className="flex-1">
              {/* Item Name */}
              <p className="text-cream font-semibold">
                {item.product?.name || 'Unknown Item'}
              </p>
              
              {/* Special Instructions */}
              {item.specialInstructions && (
                <p className="text-amber-300 text-sm mt-1 italic">
                  📝 {item.specialInstructions}
                </p>
              )}

              {/* Price Display (Edit or View Mode) */}
              {isEditing ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-light-gold text-sm">
                    {item.quantity} x
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrices[item.id] || item.price}
                    onChange={(e) => onPriceChange(item.id, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-deep-brown border border-golden rounded text-cream text-sm"
                  />
                  <span className="text-light-gold text-sm">
                    ({item.selectedSize || item.product.unit}) = $
                    {((itemPrices[item.id] || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-light-gold text-sm">
                  {item.quantity} x ${item.price.toFixed(2)} ({item.selectedSize || item.product.unit})
                </p>
              )}
            </div>

            {/* Item Subtotal and Delete Button */}
            <div className="flex items-center gap-3">
              <p className="text-golden font-bold">
                ${isEditing 
                  ? ((itemPrices[item.id] || item.price) * item.quantity).toFixed(2)
                  : item.subtotal.toFixed(2)}
              </p>
              
              {/* Delete Button - Only shown for pending/processing orders and not in edit mode */}
              {canDeleteItems && !isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteClick(item)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  title="Delete item"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Save/Cancel Buttons (when editing) */}
        {isEditing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSavePrices}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
            >
              Save Prices
            </button>
            <button
              onClick={onCancelEdit}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  )
}

