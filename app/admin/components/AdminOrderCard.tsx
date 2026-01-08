/**
 * ============================================================================
 * ADMIN ORDER CARD COMPONENT
 * ============================================================================
 * Expandable card displaying order details in admin dashboard.
 * Shows summary when collapsed, full details when expanded.
 * 
 * Features:
 * - Collapsible header with order summary
 * - Customer info display
 * - Payment status indicators with color coding
 * - Order items list with price editing
 * - Timeline and notes editing
 * - Status management actions
 * - Delete individual items from pending/processing orders
 */

'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Order, OrderItem } from '@/types'
import OrderItemsList from './OrderItemsList'
import OrderTotalEditor from './OrderTotalEditor'
import TimelineEditor from './TimelineEditor'
import OrderActions from './OrderActions'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import PaymentDateModal from './PaymentDateModal'

interface AdminOrderCardProps {
  /** The order to display */
  order: Order
  /** Whether this order is expanded */
  isExpanded: boolean
  /** Toggle expanded state */
  onToggleExpand: () => void
  /** Confirm order callback */
  onConfirmOrder: (orderId: string) => void
  /** Update status callback */
  onUpdateStatus: (orderId: string, status: string, paymentStatus?: string) => void
  /** Update order details (timeline, notes) */
  onUpdateDetails: (orderId: string, timeline: string, notes: string) => void
  /** Update item prices */
  onUpdatePrices: (orderId: string, itemPrices: Array<{ itemId: string; price: number }>) => void
  /** Update total amount */
  onUpdateTotal: (orderId: string, total: number) => void
  /** Refresh orders after item deletion */
  onRefreshOrders: () => void
}

export default function AdminOrderCard({
  order,
  isExpanded,
  onToggleExpand,
  onConfirmOrder,
  onUpdateStatus,
  onUpdateDetails,
  onUpdatePrices,
  onUpdateTotal,
  onRefreshOrders
}: AdminOrderCardProps) {
  // Local state for editing
  const [editingOrder, setEditingOrder] = useState(false)
  const [timeline, setTimeline] = useState(order.adminTimeline || '')
  const [notes, setNotes] = useState(order.adminNotes || '')
  const [editingPrices, setEditingPrices] = useState(false)
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({})
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalAmount, setTotalAmount] = useState(order.totalAmount)
  
  // State for delete item confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<OrderItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  
  // State for cancel order confirmation modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // State for payment date modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isMarkingPayment, setIsMarkingPayment] = useState(false)
  
  // State for mark completed confirmation modal
  const [showMarkCompletedModal, setShowMarkCompletedModal] = useState(false)
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false)
  const [markCompletedNote, setMarkCompletedNote] = useState('')
  
  // State for revert to processing modal
  const [showRevertModal, setShowRevertModal] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [revertReason, setRevertReason] = useState('')

  // Calculate payment days for pending payments
  const paymentDays = order.paymentStatus === 'payment_pending' && order.status === 'completed'
    ? Math.floor((new Date().getTime() - new Date(order.updatedAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Determine border/background colors based on payment status
  const { borderColor, bgColor } = getOrderColors(order, paymentDays)

  // Handle price editing
  const handleEditPrices = () => {
    const prices: Record<string, number> = {}
    order.items.forEach(item => {
      prices[item.id] = item.price
    })
    setItemPrices(prices)
    setEditingPrices(true)
  }

  const handleSavePrices = () => {
    const pricesArray = Object.entries(itemPrices).map(([itemId, price]) => ({
      itemId,
      price
    }))
    onUpdatePrices(order.id, pricesArray)
    setEditingPrices(false)
    setItemPrices({})
  }

  // Handle timeline editing
  const handleStartEditTimeline = () => {
    setEditingOrder(true)
    setTimeline(order.adminTimeline || '')
    setNotes(order.adminNotes || '')
  }

  const handleSaveDetails = () => {
    onUpdateDetails(order.id, timeline, notes)
    setEditingOrder(false)
  }

  // Handle total editing
  const handleEditTotal = () => {
    setTotalAmount(order.totalAmount)
    setEditingTotal(true)
  }

  const handleSaveTotal = () => {
    onUpdateTotal(order.id, totalAmount)
    setEditingTotal(false)
  }

  // -------------------------------------------------------------------------
  // DELETE ITEM HANDLING
  // -------------------------------------------------------------------------

  /**
   * Handle delete button click - shows confirmation modal
   * Resets the delete reason for fresh input
   * @param item - The order item to delete
   */
  const handleDeleteClick = (item: OrderItem) => {
    setItemToDelete(item)
    setDeleteReason('') // Reset reason for new deletion
    setShowDeleteModal(true)
  }

  /**
   * Confirm and execute item deletion via API
   * - Calls DELETE /api/orders/items with item and order IDs
   * - Includes deletion reason in the request
   * - Updates adminNotes with deletion record
   * - Shows success/error toast
   * - Refreshes order list on success
   */
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      // Build query params including the reason
      const params = new URLSearchParams({
        id: itemToDelete.id,
        orderId: order.id,
        reason: deleteReason.trim()
      })

      const response = await fetch(
        `/api/orders/items?${params.toString()}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete item')
      }

      // Show appropriate message based on response
      if (data.orderDeleted) {
        toast.success('Last item removed. Order deleted.')
      } else {
        toast.success(`Item removed. New total: $${data.newTotal.toFixed(2)}`)
      }

      // Refresh orders to reflect changes
      onRefreshOrders()
    } catch (error) {
      console.error('Delete item error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete item')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setItemToDelete(null)
      setDeleteReason('')
    }
  }

  // -------------------------------------------------------------------------
  // CANCEL ORDER HANDLING
  // -------------------------------------------------------------------------

  /**
   * Handle cancel button click - shows confirmation modal
   * Resets the cancel reason for fresh input
   */
  const handleCancelClick = () => {
    setCancelReason('') // Reset reason for new cancellation
    setShowCancelModal(true)
  }

  /**
   * Confirm and execute order cancellation
   * - Calls PATCH /api/orders/[id] with cancelled status
   * - Includes cancellation reason in adminNotes
   * - Shows success/error toast
   * - Refreshes order list on success
   */
  const handleConfirmCancel = async () => {
    setIsCancelling(true)
    try {
      // Build cancellation note with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const cancellationNote = `[${timestamp}] ORDER CANCELLED - Reason: ${cancelReason.trim()}`
      
      // Append to existing notes
      const existingNotes = order.adminNotes || ''
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n${cancellationNote}`
        : cancellationNote

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          adminNotes: updatedNotes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }

      toast.success('Order cancelled successfully')
      onRefreshOrders()
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error('Failed to cancel order')
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
      setCancelReason('')
    }
  }

  // -------------------------------------------------------------------------
  // MARK COMPLETED HANDLING
  // -------------------------------------------------------------------------

  /**
   * Handle mark completed button click - shows confirmation modal
   * This provides a confirmation step to prevent accidental status changes
   * Market standard: Critical status changes should have confirmation
   */
  const handleMarkCompletedClick = () => {
    setMarkCompletedNote('') // Reset note for fresh input
    setShowMarkCompletedModal(true)
  }

  /**
   * Confirm and execute order completion
   * - Updates order status to 'completed'
   * - Preserves current payment status
   * - Optionally adds note to adminNotes
   * - Shows success/error toast
   * - Refreshes order list on success
   */
  const handleConfirmMarkCompleted = async () => {
    setIsMarkingCompleted(true)
    try {
      const updateData: any = {
        status: 'completed',
        // Preserve current payment status when marking completed
        paymentStatus: order.paymentStatus || 'payment_pending'
      }

      // Add optional note if provided
      if (markCompletedNote.trim()) {
        const timestamp = new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        const completionNote = `[${timestamp}] ORDER COMPLETED${markCompletedNote.trim() ? ` - Note: ${markCompletedNote.trim()}` : ''}`
        
        // Append to existing notes
        const existingNotes = order.adminNotes || ''
        updateData.adminNotes = existingNotes 
          ? `${existingNotes}\n${completionNote}`
          : completionNote
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Failed to mark order as completed')
      }

      toast.success('Order marked as completed')
      onRefreshOrders()
    } catch (error) {
      console.error('Mark completed error:', error)
      toast.error('Failed to mark order as completed')
    } finally {
      setIsMarkingCompleted(false)
      setShowMarkCompletedModal(false)
      setMarkCompletedNote('')
    }
  }

  // -------------------------------------------------------------------------
  // REVERT TO PROCESSING HANDLING
  // -------------------------------------------------------------------------

  /**
   * Handle revert to processing button click - shows confirmation modal
   * Allows reverting completed orders back to processing status
   * Market standard: Status reversion requires reason for audit trail
   */
  const handleRevertClick = () => {
    setRevertReason('') // Reset reason for fresh input
    setShowRevertModal(true)
  }

  /**
   * Confirm and execute order reversion to processing
   * - Reverts order status from 'completed' to 'processing'
   * - Requires reason for audit trail (standard practice)
   * - Records reversion in adminNotes with timestamp
   * - Shows success/error toast
   * - Refreshes order list on success
   * 
   * Use cases:
   * - Customer didn't pick up order
   * - Order needs modification after completion
   * - Admin marked completed by mistake
   */
  const handleConfirmRevert = async () => {
    if (!revertReason.trim()) {
      toast.error('Please provide a reason for reverting')
      return
    }

    setIsReverting(true)
    try {
      // Build reversion note with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const reversionNote = `[${timestamp}] STATUS REVERTED: Completed → Processing - Reason: ${revertReason.trim()}`
      
      // Append to existing notes
      const existingNotes = order.adminNotes || ''
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n${reversionNote}`
        : reversionNote

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'processing',
          adminNotes: updatedNotes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to revert order status')
      }

      toast.success('Order reverted to processing')
      onRefreshOrders()
    } catch (error) {
      console.error('Revert order error:', error)
      toast.error('Failed to revert order status')
    } finally {
      setIsReverting(false)
      setShowRevertModal(false)
      setRevertReason('')
    }
  }

  return (
    <div className={`traditional-border ${borderColor} ${bgColor} rounded-lg overflow-hidden border-2`}>
      {/* Collapsible Header */}
      <div onClick={onToggleExpand} className="p-6 cursor-pointer hover:bg-opacity-80 transition-colors">
        <div className="flex justify-between items-start">
          {/* Order Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl golden-text font-traditional font-bold">
                Order #{order.id.slice(0, 8)}
              </h3>
              <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getStatusColor(order.status)} bg-opacity-20`}>
                {order.status.toUpperCase()}
              </span>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-light-gold font-semibold">Order Created:</p>
                <p className="text-cream">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-light-gold font-semibold">Last Updated:</p>
                <p className="text-cream">{new Date(order.updatedAt || order.createdAt).toLocaleString()}</p>
              </div>
              {order.paymentReceivedDate && (
                <div>
                  <p className="text-light-gold font-semibold">💰 Payment Received:</p>
                  <p className="text-green-400 font-bold">{new Date(order.paymentReceivedDate).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Payment Status & Customer Info */}
            <div className="mt-3 space-y-2">
              <PaymentStatusDisplay order={order} paymentDays={paymentDays} />
              <CustomerInfoDisplay order={order} />
              <PendingWarning order={order} />
            </div>
          </div>

          {/* Total & Expand Indicator */}
          <div className="text-right ml-4 flex flex-col items-end">
            <p className="text-3xl golden-text font-bold mb-2">
              ${order.totalAmount.toFixed(2)}
            </p>
            <p className="text-light-gold text-sm">
              {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="border-t-2 border-golden p-8 bg-traditional-brown bg-opacity-30">
          {/* Location & Admin Info */}
          {order.location && (
            <p className="text-light-gold text-sm mb-3">📍 Pickup Location: {order.location}</p>
          )}
          {order.adminTimeline && (
            <p className="text-golden text-sm mb-3">⏰ Timeline: {order.adminTimeline}</p>
          )}
          {order.adminNotes && (
            <p className="text-cream text-sm mb-3 bg-traditional-brown p-2 rounded">📝 Notes: {order.adminNotes}</p>
          )}

          {/* Payment Overdue Warning */}
          {order.paymentStatus === 'payment_pending' && order.status === 'completed' && paymentDays >= 7 && (
            <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border-2 border-red-700 rounded-lg">
              <p className="text-red-300 font-bold text-lg mb-2">⚠️ Payment Pending for {paymentDays} days</p>
              <p className="text-red-200 text-base">
                📞 Please call: <a href="tel:2095978565" className="underline font-bold text-white">209-597-8565</a>
              </p>
            </div>
          )}

          {/* Order Items */}
          <OrderItemsList
            items={order.items}
            orderId={order.id}
            orderStatus={order.status}
            isEditing={editingPrices}
            itemPrices={itemPrices}
            onEditClick={handleEditPrices}
            onPriceChange={(itemId, price) => setItemPrices({ ...itemPrices, [itemId]: price })}
            onSavePrices={handleSavePrices}
            onCancelEdit={() => {
              setEditingPrices(false)
              setItemPrices({})
            }}
            onDeleteClick={handleDeleteClick}
          />

          {/* Order Total */}
          <OrderTotalEditor
            totalAmount={order.totalAmount}
            isEditing={editingTotal}
            editedTotal={totalAmount}
            onEditClick={handleEditTotal}
            onTotalChange={setTotalAmount}
            onSave={handleSaveTotal}
            onCancel={() => {
              setEditingTotal(false)
              setTotalAmount(order.totalAmount)
            }}
          />

          {/* Timeline Editor OR Action Buttons */}
          {editingOrder ? (
            <TimelineEditor
              timeline={timeline}
              notes={notes}
              onTimelineChange={setTimeline}
              onNotesChange={setNotes}
              onSave={handleSaveDetails}
              onCancel={() => {
                setEditingOrder(false)
                setTimeline('')
                setNotes('')
              }}
            />
          ) : (
            <OrderActions
              order={order}
              onConfirm={onConfirmOrder}
              onUpdateStatus={onUpdateStatus}
              onEditTimeline={handleStartEditTimeline}
              onPaymentClick={() => setShowPaymentModal(true)}
              onCancelClick={handleCancelClick}
              onMarkCompletedClick={handleMarkCompletedClick}
              onRevertClick={handleRevertClick}
            />
          )}
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setItemToDelete(null)
            setDeleteReason('')
          }}
          onConfirm={handleConfirmDelete}
          itemName={`${itemToDelete.product?.name || 'Item'}${itemToDelete.selectedSize ? ` (${itemToDelete.selectedSize})` : ''}`}
          message={isDeleting ? 'Deleting item...' : 'Are you sure you want to remove this item from the order?'}
          showNoteInput={true}
          noteValue={deleteReason}
          onNoteChange={setDeleteReason}
          notePlaceholder="e.g., Customer requested removal, Out of stock, etc."
          noteRequired={true}
        />
      )}

      {/* Mark Payment Received Modal */}
      <PaymentDateModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderLabel={`Order #${order.id.slice(0, 8)}`}
        totalAmount={order.totalAmount}
        onConfirm={async ({ paymentDateISO, note }) => {
          setIsMarkingPayment(true)
          try {
            const res = await fetch(`/api/orders/${order.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentStatus: 'payment_completed',
                paymentReceivedDate: paymentDateISO,
                ...(note ? { adminNotes: `${order.adminNotes ? `${order.adminNotes}\n` : ''}[${new Date().toLocaleString()}] PAYMENT: ${note}` } : {})
              })
            })
            if (!res.ok) throw new Error('Failed to mark payment')
            toast.success('Payment marked as received')
            onRefreshOrders()
          } catch (e) {
            toast.error('Failed to mark payment')
          } finally {
            setIsMarkingPayment(false)
            setShowPaymentModal(false)
          }
        }}
      />

      {/* Cancel Order Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setCancelReason('')
        }}
        onConfirm={handleConfirmCancel}
        itemName={`Order #${order.id.slice(0, 8)}`}
        message={isCancelling ? 'Cancelling order...' : 'Are you sure you want to cancel this entire order?'}
        showNoteInput={true}
        noteValue={cancelReason}
        onNoteChange={setCancelReason}
        notePlaceholder="e.g., Customer requested cancellation, Unable to fulfill, etc."
        noteRequired={true}
        variant="cancel"
      />

      {/* Mark Completed Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showMarkCompletedModal}
        onClose={() => {
          setShowMarkCompletedModal(false)
          setMarkCompletedNote('')
        }}
        onConfirm={handleConfirmMarkCompleted}
        itemName={`Order #${order.id.slice(0, 8)}`}
        message={isMarkingCompleted ? 'Marking order as completed...' : 'Are you sure this order is ready for pickup? Marking as completed will finalize the order status.'}
        showNoteInput={true}
        noteValue={markCompletedNote}
        onNoteChange={setMarkCompletedNote}
        notePlaceholder="e.g., Ready for pickup, Special instructions, etc. (optional)"
        noteRequired={false}
        variant="confirm"
        title="Mark Order as Completed"
        confirmText="Mark Completed"
        icon="✓"
        reasonLabel="Completion notes (optional)"
      />

      {/* Revert to Processing Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showRevertModal}
        onClose={() => {
          setShowRevertModal(false)
          setRevertReason('')
        }}
        onConfirm={handleConfirmRevert}
        itemName={`Order #${order.id.slice(0, 8)}`}
        message={isReverting ? 'Reverting order status...' : 'Are you sure you want to revert this completed order back to processing? This action requires a reason for audit trail.'}
        showNoteInput={true}
        noteValue={revertReason}
        onNoteChange={setRevertReason}
        notePlaceholder="e.g., Customer didn't pick up, Order needs modification, etc."
        noteRequired={true}
        variant="revert"
        title="Revert Order to Processing"
        confirmText="Revert to Processing"
        icon="↩️"
        reasonLabel="Reason for reversion"
      />
    </div>
  )
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStatusColor(status: string): string {
  switch (status) {
    case 'processing': return 'text-blue-400'
    case 'completed': return 'text-green-400'
    case 'cancelled': return 'text-red-400'
    default: return 'text-yellow-400'
  }
}

function getOrderColors(order: Order, paymentDays: number): { borderColor: string; bgColor: string } {
  if (order.paymentStatus === 'payment_completed') {
    return { borderColor: 'border-green-500', bgColor: 'bg-deep-brown' }
  }
  if (order.paymentStatus === 'payment_pending' && order.status === 'completed') {
    if (paymentDays >= 7) {
      return { borderColor: 'border-red-700', bgColor: 'bg-red-950 bg-opacity-30' }
    }
    return { borderColor: 'border-yellow-500', bgColor: 'bg-yellow-950 bg-opacity-20' }
  }
  return { borderColor: 'border-golden', bgColor: 'bg-deep-brown' }
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function PaymentStatusDisplay({ order, paymentDays }: { order: Order; paymentDays: number }) {
  let paymentColor = 'text-green-400'
  let paymentText = '✅ Payment Completed'

  if (order.paymentStatus === 'payment_pending') {
    if (order.status === 'completed') {
      paymentColor = paymentDays >= 5 ? 'text-red-700' : 'text-red-400'
      paymentText = `⏳ Payment Pending (${paymentDays} days)`
    } else {
      paymentColor = 'text-yellow-400'
      paymentText = '⏳ Payment Pending'
    }
  }

  return <p className={`text-base font-bold ${paymentColor}`}>{paymentText}</p>
}

function CustomerInfoDisplay({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <p className="text-cream">
        <span className="text-light-gold font-semibold">👤 Customer:</span> {order.customerName || order.user?.name || 'N/A'}
      </p>
      <p className="text-cream">
        <span className="text-light-gold font-semibold">📞 Phone:</span> {order.customerPhone || order.user?.phone || 'N/A'}
      </p>
      {order.location && (
        <p className="text-light-gold">
          <span className="font-semibold">📍 Location:</span> {order.location}
        </p>
      )}
      {order.pickupDate && (
        <p className="text-golden">
          <span className="font-semibold">📅 Pickup Date:</span> {new Date(order.pickupDate).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

function PendingWarning({ order }: { order: Order }) {
  if (order.status !== 'pending') return null
  
  const daysPending = Math.floor(
    (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysPending < 1) return null

  return (
    <p className="text-red-400 text-xs mt-1">
      ⚠️ Pending {daysPending} day(s) - Call customer
    </p>
  )
}

