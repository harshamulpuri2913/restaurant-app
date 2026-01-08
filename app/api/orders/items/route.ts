/**
 * ============================================================================
 * ORDER ITEMS API ROUTE
 * ============================================================================
 * API endpoint for managing individual order items.
 * 
 * Endpoints:
 * - DELETE /api/orders/items - Remove an item from an order
 * 
 * Features:
 * - Delete individual items from pending or processing orders
 * - Automatic total recalculation
 * - Delete entire order if last item is removed
 * - Owner and admin authorization
 * 
 * Access Control:
 * - Order owner can delete items from their pending orders
 * - Admin can delete items from any pending or processing order
 * 
 * @requires Authentication
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// =============================================================================
// DELETE - REMOVE ORDER ITEM
// =============================================================================

/**
 * Delete an item from a pending or processing order
 * 
 * Workflow:
 * 1. Validate required parameters (item ID, order ID)
 * 2. Fetch order and verify it exists
 * 3. Verify order is in pending/processing status
 * 4. Check user authorization (owner or admin)
 * 5. Handle special case: last item in order
 * 6. Delete item and recalculate order total
 * 7. Record deletion reason in adminNotes (if provided)
 * 
 * Query Parameters:
 * - id: The order item ID to delete
 * - orderId: The parent order ID
 * - reason: (optional) Reason for deletion - stored in adminNotes
 * 
 * @example DELETE /api/orders/items?id=item123&orderId=order456&reason=Customer%20requested
 * 
 * @param request - HTTP request with query parameters
 * @returns Success message with new total or order deleted status
 */
export async function DELETE(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // PARSE QUERY PARAMETERS
    // -------------------------------------------------------------------------
    
    const { searchParams } = new URL(request.url)
    const orderItemId = searchParams.get('id')
    const orderId = searchParams.get('orderId')
    const deletionReason = searchParams.get('reason') || ''

    // Validate required parameters
    if (!orderItemId || !orderId) {
      return NextResponse.json(
        { error: 'Order item ID and order ID are required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // FETCH ORDER WITH ITEMS AND PRODUCTS
    // -------------------------------------------------------------------------
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true, // Need product info for deletion note
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // -------------------------------------------------------------------------
    // VALIDATE ORDER STATUS
    // -------------------------------------------------------------------------
    
    /**
     * Only pending and processing orders can have items modified
     * Once an order is completed/cancelled, items are locked
     * This allows admins to adjust orders during the preparation phase
     */
    const allowedStatuses = ['pending', 'processing']
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: 'Can only delete items from pending or processing orders' },
        { status: 403 }
      )
    }

    // -------------------------------------------------------------------------
    // AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const isAdmin = session.user.role === 'admin'
    const isOwner = order.userId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this item' },
        { status: 403 }
      )
    }

    // -------------------------------------------------------------------------
    // HANDLE LAST ITEM CASE
    // -------------------------------------------------------------------------
    
    /**
     * If this is the last item in the order, delete the entire order
     * An order with no items doesn't make sense to keep
     */
    if (order.items.length === 1) {
      await prisma.order.delete({
        where: { id: orderId },
      })

      return NextResponse.json({
        success: true,
        message: 'Last item removed. Order deleted.',
        orderDeleted: true,
      })
    }

    // -------------------------------------------------------------------------
    // FIND AND VALIDATE ITEM
    // -------------------------------------------------------------------------
    
    const itemToDelete = order.items.find(item => item.id === orderItemId)
    if (!itemToDelete) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    // -------------------------------------------------------------------------
    // DELETE ITEM AND RECALCULATE TOTAL
    // -------------------------------------------------------------------------
    
    // Delete the order item
    await prisma.orderItem.delete({
      where: { id: orderItemId },
    })

    // Calculate new order total (sum of remaining items)
    const newTotal = order.items
      .filter(item => item.id !== orderItemId)
      .reduce((sum, item) => sum + item.subtotal, 0)

    // -------------------------------------------------------------------------
    // BUILD DELETION NOTE FOR AUDIT TRAIL
    // -------------------------------------------------------------------------
    
    /**
     * Create a timestamped note recording the deletion
     * Format: [YYYY-MM-DD HH:MM] DELETED: ItemName (Size) - Reason: ...
     */
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const itemName = itemToDelete.product?.name || 'Unknown Item'
    const itemSize = itemToDelete.selectedSize ? ` (${itemToDelete.selectedSize})` : ''
    const reasonText = deletionReason ? ` - Reason: ${deletionReason}` : ''
    
    const deletionNote = `[${timestamp}] DELETED: ${itemName}${itemSize}${reasonText}`
    
    // Append to existing adminNotes or create new
    const existingNotes = order.adminNotes || ''
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n${deletionNote}`
      : deletionNote

    // Update order with new total and deletion note
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        totalAmount: newTotal,
        adminNotes: updatedNotes
      },
    })

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      newTotal,
      orderDeleted: false,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete order item' },
      { status: 500 }
    )
  }
}
