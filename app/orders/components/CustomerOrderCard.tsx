/**
 * ============================================================================
 * CUSTOMER ORDER CARD COMPONENT
 * ============================================================================
 * Expandable card for displaying order details to customers.
 * Shows summary when collapsed, full details when expanded.
 * 
 * Features:
 * - Collapsible order summary
 * - Order items with special instructions
 * - Status-specific messaging
 * - Item deletion for pending orders
 * - Pending order warnings
 */

'use client'

import { Order } from '@/types'
import OrderStatusDisplay from './OrderStatusDisplay'

interface CustomerOrderCardProps {
  /** The order to display */
  order: Order
  /** Whether the card is expanded */
  isExpanded: boolean
  /** Toggle expand callback */
  onToggleExpand: () => void
  /** Cancel order callback */
  onCancelOrder: (orderId: string) => void
  /** Delete item callback */
  onDeleteItem: (orderId: string, itemId: string, itemName: string) => void
}

/**
 * Calculate days since order creation
 */
const getDaysPending = (createdAt: string): number => {
  return Math.floor(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Get status color class
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'processing': return 'text-blue-400'
    case 'completed': return 'text-green-400'
    case 'cancelled': return 'text-red-400'
    default: return 'text-yellow-400'
  }
}

export default function CustomerOrderCard({
  order,
  isExpanded,
  onToggleExpand,
  onCancelOrder,
  onDeleteItem
}: CustomerOrderCardProps) {
  const daysPending = getDaysPending(order.createdAt)

  return (
    <div className="traditional-border bg-deep-brown rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Order Info */}
          <div className="flex-1 w-full sm:w-auto">
            <h3 className="text-xl sm:text-2xl golden-text font-traditional mb-2">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-light-gold text-sm sm:text-base">
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className={`font-bold mt-2 text-sm sm:text-base ${getStatusColor(order.status)}`}>
              Status: {order.status.toUpperCase()}
            </p>

            {/* Customer Details */}
            <div className="mt-2 space-y-1">
              <p className="text-cream text-xs sm:text-sm">
                👤 {order.customerName || order.user?.name || 'N/A'}
              </p>
              <p className="text-cream text-xs sm:text-sm">
                📞 {order.customerPhone || order.user?.phone || 'N/A'}
              </p>
              {order.location && (
                <p className="text-light-gold text-xs sm:text-sm">
                  📍 Pickup: {order.location}
                </p>
              )}
              {order.pickupDate && (
                <p className="text-light-gold text-xs sm:text-sm">
                  📅 Pickup Date: {new Date(order.pickupDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Pending Warning */}
            {order.status === 'pending' && daysPending >= 1 && (
              <div className="mt-2 p-2 bg-red-600 rounded text-white text-xs sm:text-sm">
                ⚠️ Order pending for {daysPending} day(s). Please call 209-597-8565 to confirm.
              </div>
            )}
          </div>

          {/* Total & Expand Indicator */}
          <div className="text-left sm:text-right w-full sm:w-auto flex justify-between sm:flex-col items-center sm:items-end">
            <p className="text-xl sm:text-2xl golden-text font-bold">
              ${order.totalAmount.toFixed(2)}
            </p>
            <p className="text-light-gold text-xs sm:text-sm mt-0 sm:mt-2">
              {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t-2 border-golden p-4 sm:p-6 bg-traditional-brown bg-opacity-30">
          {/* Items List */}
          <h4 className="text-lg sm:text-xl golden-text mb-3 font-traditional">
            Items:
          </h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-deep-brown p-3 rounded-lg border border-golden border-opacity-20"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  {/* Item Details */}
                  <div className="flex-1">
                    <p className="text-cream font-bold text-sm sm:text-base">
                      {item.product.name}
                    </p>
                    <p className="text-light-gold text-xs sm:text-sm">
                      {item.quantity} x ${item.price.toFixed(2)} ({item.selectedSize || item.product.unit})
                    </p>
                    {item.specialInstructions && (
                      <p className="text-amber-300 text-xs sm:text-sm mt-1 italic">
                        📝 {item.specialInstructions}
                      </p>
                    )}
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <p className="text-golden font-bold text-sm sm:text-base">
                      ${item.subtotal.toFixed(2)}
                    </p>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => onDeleteItem(
                          order.id,
                          item.id,
                          item.product.name + (item.selectedSize ? ` (${item.selectedSize})` : '')
                        )}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-colors text-xs sm:text-sm flex items-center gap-1"
                        title="Delete item"
                      >
                        <span className="text-sm">🗑️</span>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          <div className="mt-4">
            <OrderStatusDisplay
              order={order}
              onCancelOrder={order.status === 'pending' ? onCancelOrder : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}

