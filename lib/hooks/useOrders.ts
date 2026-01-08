/**
 * ============================================================================
 * USE ORDERS HOOK
 * ============================================================================
 * Custom hook for fetching and managing orders.
 * Provides reusable order operations across components.
 * 
 * Features:
 * - Fetch orders with optional filters
 * - Update order status
 * - Cancel orders
 * - Delete order items
 * - Loading and error states
 */

'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Order, DateRange } from '@/types'

interface UseOrdersOptions {
  /** Initial fetch on hook mount */
  fetchOnMount?: boolean
}

interface UseOrdersReturn {
  /** Current orders data */
  orders: Order[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
  /** Fetch/refresh orders */
  fetchOrders: () => Promise<void>
  /** Update order status */
  updateOrderStatus: (orderId: string, status: string, paymentStatus?: string) => Promise<boolean>
  /** Cancel an order */
  cancelOrder: (orderId: string) => Promise<boolean>
  /** Confirm a pending order */
  confirmOrder: (orderId: string) => Promise<boolean>
  /** Delete an order item */
  deleteOrderItem: (orderId: string, itemId: string) => Promise<boolean>
  /** Update order details (timeline, notes) */
  updateOrderDetails: (orderId: string, timeline: string, notes: string) => Promise<boolean>
  /** Filter orders by criteria */
  filterOrders: (status?: string, paymentStatus?: string, dateRange?: DateRange) => Order[]
}

/**
 * Custom hook for order management
 */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all orders from API
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders'
      setError(message)
      setOrders([])
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: string,
    paymentStatus?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(paymentStatus && { paymentStatus }),
        }),
      })

      if (!res.ok) throw new Error('Failed to update order')

      toast.success('Order status updated')
      await fetchOrders() // Refresh orders
      return true
    } catch (err) {
      toast.error('Failed to update order status')
      return false
    }
  }, [fetchOrders])

  /**
   * Cancel an order
   */
  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    return updateOrderStatus(orderId, 'cancelled')
  }, [updateOrderStatus])

  /**
   * Confirm a pending order
   */
  const confirmOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to confirm order')

      toast.success('Order confirmed! Status changed to processing.')
      await fetchOrders() // Refresh orders
      return true
    } catch (err) {
      toast.error('Failed to confirm order')
      return false
    }
  }, [fetchOrders])

  /**
   * Delete an order item
   */
  const deleteOrderItem = useCallback(async (
    orderId: string,
    itemId: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/items?id=${itemId}&orderId=${orderId}`, {
        method: 'DELETE',
      })

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

      await fetchOrders() // Refresh orders
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item'
      toast.error(message)
      return false
    }
  }, [fetchOrders])

  /**
   * Update order details (timeline, notes)
   */
  const updateOrderDetails = useCallback(async (
    orderId: string,
    timeline: string,
    notes: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminTimeline: timeline,
          adminNotes: notes,
        }),
      })

      if (!res.ok) throw new Error('Failed to update order')

      toast.success('Order details updated')
      await fetchOrders() // Refresh orders
      return true
    } catch (err) {
      toast.error('Failed to update order details')
      return false
    }
  }, [fetchOrders])

  /**
   * Filter orders by status, payment status, and date range
   */
  const filterOrders = useCallback((
    status?: string,
    paymentStatus?: string,
    dateRange?: DateRange
  ): Order[] => {
    let filtered = [...orders]

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(order => order.status === status)
    }

    // Filter by payment status (only for completed)
    if (paymentStatus && paymentStatus !== 'all' && status === 'completed') {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatus)
    }

    // Filter by date range
    if (dateRange && dateRange !== 'all') {
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

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate && orderDate <= now
      })
    }

    return sortOrders(filtered)
  }, [orders])

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    confirmOrder,
    deleteOrderItem,
    updateOrderDetails,
    filterOrders,
  }
}

/**
 * Sort orders by most recent update, then by creation date
 */
function sortOrders(orders: Order[]): Order[] {
  return orders.sort((a, b) => {
    const updatedA = new Date(a.updatedAt || a.createdAt).getTime()
    const updatedB = new Date(b.updatedAt || b.createdAt).getTime()
    if (updatedB !== updatedA) return updatedB - updatedA

    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
}

export default useOrders

