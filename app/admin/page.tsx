/**
 * ============================================================================
 * ADMIN DASHBOARD PAGE
 * ============================================================================
 * Main admin interface for order management and business operations.
 * 
 * This page provides:
 * - Order listing with filtering (status, payment, date range)
 * - Order management (confirm, update status, edit prices)
 * - Export functionality
 * - Navigation to products, inventory, earnings
 * 
 * Component Structure:
 * - AdminHeader: Navigation and action buttons
 * - OrderFilters: Filter controls
 * - AdminOrderCard: Individual order cards (expandable)
 * - Pagination: Page navigation
 * 
 * @see app/admin/components/ for individual component documentation
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

// Admin Components
import {
  AdminHeader,
  AdminOrderCard,
  OrderFilters
} from './components'

// UI Components
import { Pagination } from '@/components/ui'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

// Types
import { Order, DateRange } from '@/types'

// =============================================================================
// CONSTANTS
// =============================================================================

const ORDERS_PER_PAGE = 10

// =============================================================================
// COMPONENT
// =============================================================================

export default function AdminPage() {
  // ---------------------------------------------------------------------------
  // HOOKS & STATE
  // ---------------------------------------------------------------------------
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [filter, setFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [dateFilterType, setDateFilterType] = useState<'order' | 'payment'>('payment') // Default to payment date

  // UI state
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // State for delete all orders confirmation modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [deleteAllCode, setDeleteAllCode] = useState('')
  /**
   * Security code for delete all orders action
   * Market standard: Critical data deletion requires security verification
   * This prevents accidental deletion of all order data
   */
  const DELETE_ALL_SECURITY_CODE = '6767'

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Initialize admin session and fetch orders
   */
  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return

    // Redirect if not logged in
    if (!session) {
      router.push('/signin')
      return
    }

    // Redirect if not admin
    if (session.user.role !== 'admin') {
      router.push('/menu')
      return
    }

    fetchOrders()
  }, [session, status, router])

  /**
   * Reset page when filters change
   */
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, paymentFilter, dateRange])

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  /**
   * Fetch all orders from API
   */
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // FILTERING & SORTING
  // ---------------------------------------------------------------------------

  /**
   * Get filtered and sorted orders based on current filters
   */
  const getFilteredOrders = (): Order[] => {
    let filtered = Array.isArray(orders) ? [...orders] : []

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter)
    }

    // Filter by payment status (only for completed)
    if (paymentFilter !== 'all' && filter === 'completed') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter)
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date()
      now.setHours(23, 59, 59, 999)
      let startDate: Date

      switch (dateRange) {
        case 'today':
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'weeks':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'months':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'months3':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          startDate.setHours(0, 0, 0, 0)
          break
        default:
          return sortOrders(filtered)
      }

      // Filter by selected date type (Order Date or Payment Date)
      filtered = filtered.filter(order => {
        let orderDate: Date
        
        if (dateFilterType === 'payment') {
          // Use payment received date if available, otherwise fall back to order created date
          // This handles backward compatibility for old orders without paymentReceivedDate
          orderDate = order.paymentReceivedDate 
            ? new Date(order.paymentReceivedDate) 
            : new Date(order.createdAt)
        } else {
          // Use order created date
          orderDate = new Date(order.createdAt)
        }
        
        return orderDate >= startDate && orderDate <= now
      })
    }

    return sortOrders(filtered)
  }

  /**
   * Sort orders by most recently updated, then by created date
   */
  const sortOrders = (orders: Order[]): Order[] => {
    return orders.sort((a, b) => {
      const updatedA = new Date(a.updatedAt || a.createdAt).getTime()
      const updatedB = new Date(b.updatedAt || b.createdAt).getTime()
      if (updatedB !== updatedA) return updatedB - updatedA
      
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
  }

  // ---------------------------------------------------------------------------
  // ORDER ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Confirm a pending order
   */
  const handleConfirmOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order && order.status === 'pending') {
      const daysPending = Math.floor(
        (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysPending >= 1) {
        const shouldProceed = confirm(
          `⚠️ This order has been pending for ${daysPending} day(s).\n\n` +
          `Please call the customer at ${order.customerPhone || order.user?.phone || 'their number'} to confirm.\n\n` +
          `Click OK to proceed if already confirmed.`
        )
        if (!shouldProceed) return
      }
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to confirm order')
      toast.success('Order confirmed! Status changed to processing.')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }

  /**
   * Update order status
   */
  const handleUpdateStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(paymentStatus && { paymentStatus }) })
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast.success('Order status updated')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  /**
   * Update order details (timeline, notes)
   */
  const handleUpdateDetails = async (orderId: string, timeline: string, notes: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminTimeline: timeline, adminNotes: notes })
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast.success('Order details updated')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order details')
    }
  }

  /**
   * Update item prices
   */
  const handleUpdatePrices = async (orderId: string, itemPrices: Array<{ itemId: string; price: number }>) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemPrices })
      })
      if (!res.ok) throw new Error('Failed to update prices')
      toast.success('Item prices updated!')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update prices')
    }
  }

  /**
   * Update order total
   */
  const handleUpdateTotal = async (orderId: string, totalAmount: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount })
      })
      if (!res.ok) throw new Error('Failed to update total')
      toast.success('Total amount updated!')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update total')
    }
  }

  // ---------------------------------------------------------------------------
  // BULK ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Export orders to Excel
   */
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter)
      if (dateRange !== 'all') params.append('dateRange', dateRange)

      const res = await fetch(`/api/orders/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentDisposition = res.headers.get('Content-Disposition')
      a.download = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'orders.xlsx'
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Orders exported successfully!')
    } catch (error) {
      toast.error('Failed to export orders')
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE ALL ORDERS HANDLING
  // ---------------------------------------------------------------------------

  /**
   * Handle delete all orders button click - shows confirmation modal
   * Market standard: Critical data deletion requires:
   * - Explicit confirmation modal
   * - Security code verification
   * - Clear warning about data loss
   */
  const handleDeleteAllClick = () => {
    setDeleteAllCode('') // Reset code for fresh input
    setShowDeleteAllModal(true)
  }

  /**
   * Confirm and execute delete all orders action
   * - Validates security code before proceeding
   * - Calls DELETE /api/orders to remove all orders
   * - Shows success/error toast
   * - Refreshes order list on success
   * 
   * Security: Requires security code match to prevent accidental deletion
   */
  const handleConfirmDeleteAll = async () => {
    // Validate security code
    if (deleteAllCode.trim() !== DELETE_ALL_SECURITY_CODE) {
      toast.error('❌ Invalid security code. Deletion cancelled.')
      return
    }

    setIsDeletingAll(true)
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete orders')
      
      const result = await res.json()
      toast.success(`✅ Successfully deleted ${result.deletedCount} order(s)`)
      
      // Refresh orders list (will be empty now)
      fetchOrders()
    } catch (error: any) {
      console.error('Delete all orders error:', error)
      toast.error(error.message || 'Failed to delete all orders')
    } finally {
      setIsDeletingAll(false)
      setShowDeleteAllModal(false)
      setDeleteAllCode('')
    }
  }

  // ---------------------------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------------------------

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

  const filteredOrders = getFilteredOrders()
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE)

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-golden text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen textured-bg p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <AdminHeader
          onExport={handleExport}
          onDeleteAll={handleDeleteAllClick}
        />

        {/* Filter Controls */}
        <OrderFilters
          filter={filter}
          paymentFilter={paymentFilter}
          dateRange={dateRange}
          dateFilterType={dateFilterType}
          onFilterChange={setFilter}
          onPaymentFilterChange={setPaymentFilter}
          onDateRangeChange={setDateRange}
          onDateFilterTypeChange={setDateFilterType}
        />

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
              <p className="text-cream text-xl">No orders found</p>
            </div>
          ) : (
            <>
              {paginatedOrders.map((order) => (
                <AdminOrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedOrders.has(order.id)}
                  onToggleExpand={() => toggleOrderExpand(order.id)}
                  onConfirmOrder={handleConfirmOrder}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateDetails={handleUpdateDetails}
                  onUpdatePrices={handleUpdatePrices}
                  onUpdateTotal={handleUpdateTotal}
                  onRefreshOrders={fetchOrders}
                />
              ))}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredOrders.length}
                itemLabel="orders"
              />
            </>
          )}
        </div>
      </div>

      {/* Delete All Orders Confirmation Modal */}
      {/* Centered modal with security code verification for critical data deletion */}
      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => {
          setShowDeleteAllModal(false)
          setDeleteAllCode('')
        }}
        onConfirm={handleConfirmDeleteAll}
        itemName="ALL ORDERS"
        message={isDeletingAll 
          ? 'Deleting all orders...' 
          : '⚠️ WARNING: This action will PERMANENTLY DELETE ALL orders from the database. This action cannot be undone. Are you absolutely sure?'}
        showCodeInput={true}
        codeValue={deleteAllCode}
        onCodeChange={setDeleteAllCode}
        codePlaceholder="Enter security code..."
        codeLabel="Security Code"
        expectedCode={DELETE_ALL_SECURITY_CODE}
        variant="delete"
        title="Delete All Orders"
        confirmText="Delete All Orders"
        icon="🗑️"
      />

      <ContactFooter />
    </div>
  )
}
