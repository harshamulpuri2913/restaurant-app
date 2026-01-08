/**
 * ============================================================================
 * ORDERS API ROUTE
 * ============================================================================
 * Main API endpoint for order management in the Restaurant App.
 * 
 * Endpoints:
 * - POST /api/orders - Create a new order
 * - GET /api/orders - List orders (user's own or all for admin)
 * - DELETE /api/orders - Delete all orders (admin only)
 * 
 * Features:
 * - Cart validation and price calculation
 * - Support for product size variants
 * - Special instructions per item
 * - Customer info and pickup details
 * - Role-based access control
 * 
 * @requires Authentication - All endpoints require authenticated session
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage, formatOrderMessage } from '@/lib/whatsapp'

// =============================================================================
// POST - CREATE NEW ORDER
// =============================================================================

/**
 * Create a new order from cart items
 * 
 * Flow:
 * 1. Validate user session
 * 2. Validate cart items exist
 * 3. Fetch product details and verify availability
 * 4. Calculate prices based on selected size variants
 * 5. Create order with all items
 * 
 * Request Body:
 * ```json
 * {
 *   "items": [
 *     {
 *       "productId": "string",
 *       "quantity": number,
 *       "selectedSize": "string" (optional),
 *       "specialInstructions": "string" (optional)
 *     }
 *   ],
 *   "customerInfo": {
 *     "name": "string",
 *     "phone": "string",
 *     "email": "string" (optional)
 *   },
 *   "location": "string" (optional),
 *   "pickupDate": "ISO date string" (optional)
 * }
 * ```
 * 
 * @param request - HTTP request with order data
 * @returns Created order with items and product details
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // PARSE AND VALIDATE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { items, customerInfo, location, pickupDate } = body

    // Validate cart is not empty
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // PROCESS CART ITEMS AND CALCULATE TOTALS
    // -------------------------------------------------------------------------
    
    let totalAmount = 0
    const orderItems = []

    /**
     * Process each cart item:
     * - Verify product exists and is available
     * - Determine correct price (base or variant)
     * - Calculate subtotal
     * - Build order item data
     */
    for (const item of items) {
      // Fetch product details
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      // Validate product availability
      if (!product || !product.isAvailable) {
        return NextResponse.json(
          { error: `Product ${item.productId} not available` },
          { status: 400 }
        )
      }

      // Determine price based on selected size variant
      // If product has variants and a size is selected, use variant price
      let itemPrice = product.price
      const variants = product.variants as Record<string, number> | null
      if (variants && item.selectedSize && variants[item.selectedSize]) {
        itemPrice = variants[item.selectedSize]
      }

      // Calculate item subtotal
      const subtotal = itemPrice * item.quantity
      totalAmount += subtotal

      // Build order item data
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
        subtotal,
        selectedSize: item.selectedSize || null,
        specialInstructions: item.specialInstructions || null,
      })
    }

    // -------------------------------------------------------------------------
    // CREATE ORDER IN DATABASE
    // -------------------------------------------------------------------------
    
    /**
     * Create order with related items in a single transaction
     * Initial status: pending (awaiting admin confirmation)
     * Initial payment: payment_pending
     * 
     * Uses authenticated user's session data
     */
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount,
        status: 'pending',
        paymentStatus: 'payment_pending',
        location: location || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        // Use customerInfo from form, fallback to session data
        customerName: customerInfo?.name || session.user.name || null,
        customerPhone: customerInfo?.phone || null,
        customerEmail: customerInfo?.email || session.user.email || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - LIST ORDERS
// =============================================================================

/**
 * Retrieve orders based on user role
 * 
 * Access Control:
 * - Regular users: See only their own orders
 * - Admin users: See all orders
 * 
 * Response includes:
 * - Order details (status, payment, dates, totals)
 * - Order items with product details
 * - User/customer information
 * 
 * @param request - HTTP request
 * @returns Array of orders sorted by creation date (newest first)
 */
export async function GET(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // BUILD QUERY BASED ON USER ROLE
    // -------------------------------------------------------------------------
    
    const { searchParams } = new URL(request.url)
    const isAdmin = session.user.role === 'admin'

    // Admin sees all orders, regular users see only their own
    const where: any = isAdmin ? {} : { userId: session.user.id }

    // -------------------------------------------------------------------------
    // FETCH ORDERS WITH RELATED DATA
    // -------------------------------------------------------------------------
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true, // Include product details for each item
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
      orderBy: {
        createdAt: 'desc', // Newest orders first
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - REMOVE ALL ORDERS (ADMIN ONLY)
// =============================================================================

/**
 * Delete all orders from the system
 * 
 * WARNING: This is a destructive operation!
 * Only accessible by admin users.
 * 
 * OrderItems are automatically deleted due to cascade delete
 * configured in the Prisma schema.
 * 
 * @param request - HTTP request
 * @returns Success message with count of deleted orders
 */
export async function DELETE(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // DELETE ALL ORDERS
    // -------------------------------------------------------------------------
    
    // OrderItems will be deleted automatically due to cascade
    const deleteResult = await prisma.order.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} order(s)`,
      deletedCount: deleteResult.count,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete orders' },
      { status: 500 }
    )
  }
}
