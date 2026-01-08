/**
 * ============================================================================
 * ORDER CONFIRMATION API ROUTE
 * ============================================================================
 * Admin endpoint for confirming pending orders.
 * 
 * Endpoints:
 * - POST /api/orders/[id]/confirm - Confirm a pending order
 * 
 * Features:
 * - Moves order from 'pending' to 'processing' status
 * - Sends WhatsApp notification to admin
 * - Marks order as having WhatsApp notification sent
 * 
 * Access Control:
 * - Admin only - Regular users cannot access this endpoint
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsapp'

// =============================================================================
// POST - CONFIRM ORDER
// =============================================================================

/**
 * Confirm a pending order and move it to processing
 * 
 * Workflow:
 * 1. Verify admin authentication
 * 2. Fetch order with items and user details
 * 3. Validate order exists and is in pending status
 * 4. Update order status to 'processing'
 * 5. Send WhatsApp notification to admin phone
 * 
 * Use Case:
 * Admin reviews a new order, verifies details, and confirms it.
 * This triggers the preparation workflow and notifies relevant parties.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing order ID
 * @returns Updated order with confirmation status
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      )
    }

    // -------------------------------------------------------------------------
    // FETCH ORDER WITH RELATED DATA
    // -------------------------------------------------------------------------
    
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true, // Include product details for WhatsApp message
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

    // -------------------------------------------------------------------------
    // VALIDATE ORDER
    // -------------------------------------------------------------------------
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only pending orders can be confirmed
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in pending status' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // UPDATE ORDER STATUS
    // -------------------------------------------------------------------------
    
    /**
     * Update order:
     * - status: 'processing' (admin has confirmed, preparation begins)
     * - whatsappSent: true (mark notification as sent)
     */
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { 
        status: 'processing',
        whatsappSent: true,
      },
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

    // -------------------------------------------------------------------------
    // SEND WHATSAPP NOTIFICATION
    // -------------------------------------------------------------------------
    
    /**
     * Send notification to admin phone number
     * Uses customer info from order or falls back to user account info
     */
    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '2095978565'
    
    const customerInfo = {
      name: order.customerName || order.user.name || 'Customer',
      phone: order.customerPhone || order.user.phone || 'N/A',
      email: order.customerEmail || order.user.email || 'N/A',
    }

    const message = formatOrderMessage(updatedOrder, customerInfo)
    await sendWhatsAppMessage(adminNumber, message)

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order confirmed and moved to processing',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    )
  }
}
