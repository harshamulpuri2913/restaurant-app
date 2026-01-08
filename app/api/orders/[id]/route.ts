/**
 * ============================================================================
 * ORDER BY ID API ROUTE
 * ============================================================================
 * API endpoint for updating individual orders.
 * 
 * Endpoints:
 * - PATCH /api/orders/[id] - Update order status, payment, or details
 * 
 * Features:
 * - Order status updates (pending, processing, completed, cancelled)
 * - Payment status updates
 * - Admin timeline and notes
 * - Item price editing (admin only)
 * - Total amount adjustment (admin only)
 * - User can cancel their own pending orders
 * 
 * @requires Authentication - All endpoints require authenticated session
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// =============================================================================
// PATCH - UPDATE ORDER
// =============================================================================

/**
 * Update an existing order
 * 
 * Authorization Rules:
 * - Admin: Can update any field on any order
 * - User: Can only cancel their own pending orders
 * 
 * Updatable Fields:
 * - status: Order status (pending/processing/completed/cancelled)
 * - paymentStatus: Payment status (payment_pending/payment_completed)
 * - adminTimeline: Admin-set timeline for order
 * - adminNotes: Internal notes from admin
 * - itemPrices: Array of { itemId, price } to update individual item prices
 * - totalAmount: Override total (after item price updates)
 * 
 * Request Body:
 * ```json
 * {
 *   "status": "processing",
 *   "paymentStatus": "payment_completed",
 *   "adminTimeline": "Ready by 3pm",
 *   "adminNotes": "Customer requested extra spicy",
 *   "itemPrices": [
 *     { "itemId": "abc123", "price": 15.99 }
 *   ],
 *   "totalAmount": 45.99
 * }
 * ```
 * 
 * @param request - HTTP request with update data
 * @param params - Route parameters containing order ID
 * @returns Updated order with items and user details
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // FETCH EXISTING ORDER
    // -------------------------------------------------------------------------
    
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // -------------------------------------------------------------------------
    // PARSE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { status, paymentStatus, adminTimeline, adminNotes, itemPrices, totalAmount, paymentReceivedDate } = body
    const isCancelling = status === 'cancelled'
    const isOwnOrder = existingOrder.userId === session.user.id
    
    // -------------------------------------------------------------------------
    // AUTHORIZATION CHECKS
    // -------------------------------------------------------------------------
    
    // Only admin can modify prices and total amount
    if ((itemPrices !== undefined || totalAmount !== undefined) && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admin can modify prices' },
        { status: 401 }
      )
    }
    
    /**
     * Authorization Logic:
     * 1. User cancelling their own pending order - ALLOWED
     * 2. Admin doing anything - ALLOWED
     * 3. Everything else - DENIED
     */
    if (isCancelling && isOwnOrder && existingOrder.status === 'pending') {
      // User can cancel their own pending order - allow it
    } else if (session.user.role !== 'admin') {
      // Non-admin users can only cancel their own pending orders
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // BUILD UPDATE DATA
    // -------------------------------------------------------------------------
    
    const updateData: any = {}
    
    // Validate and set status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    
    // Handle payment status update
    if (paymentStatus && ['payment_pending', 'payment_completed'].includes(paymentStatus)) {
      updateData.paymentStatus = paymentStatus
      
      // Track payment received date
      if (paymentStatus === 'payment_completed') {
        /**
         * Allow clients to provide the payment date (e.g., backdating).
         * Fallback to current time if none provided or invalid.
         */
        let parsedDate: Date | null = null
        if (paymentReceivedDate) {
          const d = new Date(paymentReceivedDate)
          if (!isNaN(d.getTime())) {
            parsedDate = d
          }
        }
        updateData.paymentReceivedDate = parsedDate ?? new Date()
      } else if (paymentStatus === 'payment_pending') {
        // Clear payment received date when reverting to pending
        updateData.paymentReceivedDate = null
      }
    }
    
    // Admin timeline and notes
    if (adminTimeline !== undefined) {
      updateData.adminTimeline = adminTimeline
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    // -------------------------------------------------------------------------
    // HANDLE ITEM PRICE UPDATES (ADMIN ONLY)
    // -------------------------------------------------------------------------
    
    if (itemPrices && Array.isArray(itemPrices) && session.user.role === 'admin') {
      /**
       * Update each order item's price individually
       * Recalculate subtotal based on new price × quantity
       */
      for (const itemPrice of itemPrices) {
        if (itemPrice.itemId && itemPrice.price !== undefined) {
          const newPrice = parseFloat(itemPrice.price)
          
          // Get current item to calculate new subtotal
          const orderItem = await prisma.orderItem.findUnique({
            where: { id: itemPrice.itemId },
          })
          
          if (orderItem) {
            const newSubtotal = newPrice * orderItem.quantity
            await prisma.orderItem.update({
              where: { id: itemPrice.itemId },
              data: {
                price: newPrice,
                subtotal: newSubtotal,
              },
            })
          }
        }
      }
      
      // Recalculate order total from all items
      const updatedItems = await prisma.orderItem.findMany({
        where: { orderId: params.id },
      })
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
      updateData.totalAmount = newTotal
    }

    // -------------------------------------------------------------------------
    // HANDLE TOTAL AMOUNT OVERRIDE (ADMIN ONLY)
    // -------------------------------------------------------------------------
    
    /**
     * Allow admin to manually set total amount
     * This overrides the calculated total from items
     * Useful for applying discounts or adjustments
     */
    if (totalAmount !== undefined && session.user.role === 'admin') {
      updateData.totalAmount = parseFloat(totalAmount)
    }

    // -------------------------------------------------------------------------
    // VALIDATE UPDATE DATA EXISTS
    // -------------------------------------------------------------------------
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // PERFORM UPDATE
    // -------------------------------------------------------------------------
    
    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
