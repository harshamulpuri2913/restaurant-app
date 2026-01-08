/**
 * ============================================================================
 * ORDERS PAGE
 * ============================================================================
 * Customer-facing page displaying their order history.
 * Shows all orders with status, items, and actions.
 * 
 * This page provides:
 * - Order listing sorted by date
 * - Expandable order details
 * - Order cancellation (for pending orders)
 * - Item deletion (for pending orders)
 * - Pagination for many orders
 * 
 * Component Structure:
 * - CustomerOrderCard: Individual order display
 * - OrderStatusDisplay: Status-specific messaging
 * - Pagination: Page navigation
 * - DeleteConfirmModal: Item removal confirmation
 * 
 * @see app/orders/components/ for individual component documentation
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

// Layout Components
const Header = dynamic(() => import('@/components/Header'), { ssr: true })
const ContactFooter = dynamic(() => import('@/components/ContactFooter'), { ssr: true })

// Shared Components
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

// Orders Components
import { CustomerOrderCard } from './components'

// UI Components
import { Pagination } from '@/components/ui'

// Types
import { Order, DeleteItemPayload } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const ORDERS_PER_PAGE = 5

// =============================================================================
// COMPONENT
// =============================================================================

export default function OrdersPage() {
  // ---------------------------------------------------------------------------
  // HOOKS & STATE
  // ---------------------------------------------------------------------------
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<DeleteItemPayload | null>(null)

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Initialize orders page - auth check and data fetch
   */
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/signin')
      return
    }

    fetchOrders()
  }, [session, status, router])

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  /**
   * Fetch user's orders from API
   */
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // ORDER ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Cancel a pending order
   */
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      if (!res.ok) throw new Error('Failed to cancel order')

      toast.success('Order cancelled successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  // ---------------------------------------------------------------------------
  // ITEM MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Initiate item deletion (show confirmation modal)
   */
  const handleDeleteItemClick = (orderId: string, itemId: string, itemName: string) => {
    setItemToDelete({ orderId, itemId, itemName })
    setShowDeleteModal(true)
  }

  /**
   * Confirm and execute item deletion
   */
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const res = await fetch(
        `/api/orders/items?id=${itemToDelete.itemId}&orderId=${itemToDelete.orderId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete item')
      }

      const result = await res.json()

      if (result.orderDeleted) {
        toast.success('Last item removed. Order has been deleted.')
      } else {
        toast.success('Item deleted successfully')
      }

      fetchOrders()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast.error(error.message || 'Failed to delete item')
    }
  }

  // ---------------------------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Toggle order expansion
   */
  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------------------------

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
  const paginatedOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE)

  // ---------------------------------------------------------------------------
  // RENDER - Loading States
  // ---------------------------------------------------------------------------

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen textured-bg flex items-center justify-center">
        <div className="text-golden text-xl md:text-2xl font-traditional">
          Loading orders...
        </div>
      </div>
    )
  }

  if (!session) return null

  // ---------------------------------------------------------------------------
  // RENDER - Main Content
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen textured-bg">
      <Header />
      <div className="p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl golden-text font-traditional">
              My Orders
            </h1>
            <button
              onClick={() => router.push('/menu')}
              className="w-full sm:w-auto bg-golden text-deep-brown px-4 sm:px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional text-sm sm:text-base"
            >
              Back to Menu
            </button>
          </div>

          {/* Empty State */}
          {orders.length === 0 ? (
            <div className="traditional-border bg-deep-brown p-6 sm:p-8 rounded-lg text-center">
              <p className="text-cream text-lg sm:text-xl mb-4 font-traditional">
                No orders yet
              </p>
              <button
                onClick={() => router.push('/menu')}
                className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Orders List */}
              <div className="space-y-4 sm:space-y-6">
                {paginatedOrders.map((order) => (
                  <CustomerOrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrders.has(order.id)}
                    onToggleExpand={() => toggleOrderExpand(order.id)}
                    onCancelOrder={handleCancelOrder}
                    onDeleteItem={handleDeleteItemClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setItemToDelete(null)
          }}
          onConfirm={confirmDeleteItem}
          itemName={itemToDelete.itemName}
          message="Are you sure you want to delete this item from your order?"
        />
      )}

      <ContactFooter />
    </div>
  )
}
