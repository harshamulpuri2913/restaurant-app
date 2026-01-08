/**
 * ============================================================================
 * ORDER STATUS DISPLAY COMPONENT
 * ============================================================================
 * Displays contextual status messages based on order status.
 * Shows different messaging for pending, processing, completed, and cancelled.
 * 
 * Features:
 * - Status-specific colors and icons
 * - Timeline display for processing/completed
 * - Cancel button for pending orders
 * - Encouraging messages
 */

'use client'

import { Order } from '@/types'

interface OrderStatusDisplayProps {
  /** The order to display status for */
  order: Order
  /** Callback to cancel order (only for pending) */
  onCancelOrder?: (orderId: string) => void
}

export default function OrderStatusDisplay({ order, onCancelOrder }: OrderStatusDisplayProps) {
  switch (order.status) {
    case 'pending':
      return (
        <div className="text-center py-3 sm:py-4 bg-yellow-900 bg-opacity-30 rounded-lg border-2 border-yellow-600 px-2 sm:px-4">
          <p className="text-yellow-300 font-traditional text-base sm:text-lg mb-2">
            ⏳ "Waiting for order confirmation. Thank you for your patience!"
          </p>
          <p className="text-yellow-200 text-xs sm:text-sm font-traditional">
            🙏 We appreciate your order and will confirm it shortly.
          </p>
          {onCancelOrder && (
            <button
              onClick={() => onCancelOrder(order.id)}
              className="mt-3 sm:mt-4 bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors font-traditional text-sm sm:text-base w-full sm:w-auto"
            >
              Cancel Order
            </button>
          )}
        </div>
      )

    case 'processing':
      return (
        <div className="text-center py-3 sm:py-4 bg-blue-900 bg-opacity-30 rounded-lg border-2 border-blue-500 px-2 sm:px-4">
          <p className="text-blue-300 font-traditional text-base sm:text-lg mb-2">
            👨‍🍳 "Your order is being prepared with care!"
          </p>
          {order.adminTimeline && (
            <p className="text-blue-200 text-xs sm:text-sm font-traditional mt-2">
              📅 Expected Ready: <span className="font-bold">{order.adminTimeline}</span>
            </p>
          )}
          <p className="text-blue-200 text-xs sm:text-sm font-traditional mt-1">
            ⏰ We're working hard to make it perfect for you!
          </p>
        </div>
      )

    case 'completed':
      return (
        <div className="text-center py-3 sm:py-4 bg-green-900 bg-opacity-30 rounded-lg border-2 border-green-500 px-2 sm:px-4">
          <p className="text-green-300 font-traditional text-base sm:text-lg mb-2">
            ✅ "Your order is ready for pickup!"
          </p>
          {order.adminTimeline && (
            <p className="text-green-200 text-xs sm:text-sm font-traditional mt-2">
              📅 Ready by: <span className="font-bold">{order.adminTimeline}</span>
            </p>
          )}
          <p className="text-green-200 text-xs sm:text-sm font-traditional mt-1">
            🎉 Thank you for choosing us! We hope you enjoy every bite of your delicious food!
          </p>
        </div>
      )

    case 'cancelled':
      return (
        <div className="text-center py-3 sm:py-4 bg-red-900 bg-opacity-30 rounded-lg border-2 border-red-500 px-2 sm:px-4">
          <p className="text-red-300 font-traditional text-base sm:text-lg">
            ❌ This order has been cancelled
          </p>
        </div>
      )

    default:
      return null
  }
}

