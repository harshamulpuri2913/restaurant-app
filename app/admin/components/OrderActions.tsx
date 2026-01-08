/**
 * ============================================================================
 * ORDER ACTIONS COMPONENT
 * ============================================================================
 * Action buttons for managing order status and payments.
 * Displays different actions based on current order status.
 * 
 * Features:
 * - Confirm order (pending -> processing)
 * - Mark completed (processing -> completed)
 * - Cancel order (with reason modal)
 * - Toggle payment status
 * - Set timeline
 */

'use client'

import { Order } from '@/types'

interface OrderActionsProps {
  /** The order to display actions for */
  order: Order
  /** Callback to confirm order */
  onConfirm: (orderId: string) => void
  /** Callback to update order status */
  onUpdateStatus: (orderId: string, status: string, paymentStatus?: string) => void
  /** Callback to start editing timeline */
  onEditTimeline: () => void
  /** Callback when cancel is clicked - shows modal in parent */
  onCancelClick: () => void
  /** Callback when marking payment received - shows date modal in parent */
  onPaymentClick: () => void
  /** Callback when mark completed is clicked - shows confirmation modal in parent */
  onMarkCompletedClick: () => void
  /** Callback when revert to processing is clicked - shows reason modal in parent */
  onRevertClick: () => void
}

export default function OrderActions({
  order,
  onConfirm,
  onUpdateStatus,
  onEditTimeline,
  onCancelClick,
  onPaymentClick,
  onMarkCompletedClick,
  onRevertClick
}: OrderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {/* PENDING ORDER ACTIONS */}
      {order.status === 'pending' && (
        <>
          <ActionButton
            variant="success"
            onClick={() => onConfirm(order.id)}
          >
            ✓ Confirm Order
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={onCancelClick}
          >
            ✗ Cancel Order
          </ActionButton>
        </>
      )}

      {/* PROCESSING ORDER ACTIONS */}
      {order.status === 'processing' && (
        <>
          <ActionButton
            variant="primary"
            onClick={onEditTimeline}
          >
            ⏰ Set Timeline
          </ActionButton>
          {/* Mark Completed - Shows confirmation modal for better accuracy */}
          <ActionButton
            variant="success"
            onClick={onMarkCompletedClick}
          >
            ✓ Mark Completed
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={onCancelClick}
          >
            ✗ Cancel Order
          </ActionButton>
        </>
      )}

      {/* COMPLETED ORDER ACTIONS */}
      {order.status === 'completed' && (
        <>
          <ActionButton
            variant="primary"
            onClick={onEditTimeline}
          >
            ⏰ Set Timeline
          </ActionButton>
          {/* Revert to Processing - Allows reverting completed orders back to processing */}
          {/* Useful when: customer didn't pick up, order needs modification, admin mistake */}
          <ActionButton
            variant="warning"
            onClick={onRevertClick}
          >
            ↩️ Revert to Processing
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={onCancelClick}
          >
            ✗ Cancel Order
          </ActionButton>
        </>
      )}

      {/* PAYMENT STATUS TOGGLE (processing or completed) */}
      {(order.status === 'processing' || order.status === 'completed') && (
        <ActionButton
          variant={order.paymentStatus === 'payment_completed' ? 'warning' : 'success'}
          onClick={() => {
            if (order.paymentStatus === 'payment_pending') {
              // Open modal to capture payment date/time
              onPaymentClick()
            } else {
              // Revert to payment pending directly
              onUpdateStatus(order.id, order.status, 'payment_pending')
            }
          }}
        >
          {order.paymentStatus === 'payment_completed' 
            ? '💰 Mark Payment Pending' 
            : '💰 Mark Payment Received'}
        </ActionButton>
      )}
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface ActionButtonProps {
  variant: 'primary' | 'success' | 'danger' | 'warning'
  onClick: () => void
  children: React.ReactNode
}

/**
 * Styled action button
 */
function ActionButton({ variant, onClick, children }: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-golden text-deep-brown hover:bg-light-gold',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg font-bold transition-colors font-traditional min-w-[150px] ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}

