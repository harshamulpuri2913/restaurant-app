/**
 * ============================================================================
 * PRODUCT EARNINGS API ROUTE
 * ============================================================================
 * API endpoint for calculating and retrieving product earnings data.
 * 
 * Endpoints:
 * - GET /api/products/earnings - Get earnings data for all products
 * 
 * Features:
 * - Calculate total earnings per product
 * - Calculate spending/costs per product
 * - Calculate profit (earnings - spending)
 * - Breakdown by size variant
 * - Multiple date range options
 * - Custom date range support
 * - Only counts paid, non-cancelled orders
 * 
 * Use Cases:
 * - Admin earnings dashboard
 * - Product performance analysis
 * - Profit margin tracking
 * 
 * Access Control:
 * - Admin only - Financial data restricted to administrators
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// =============================================================================
// GET - CALCULATE PRODUCT EARNINGS
// =============================================================================

/**
 * Calculate earnings for all products
 * 
 * Query Parameters:
 * - dateRange: Preset date range (today/weeks/months/quarter/all)
 * - startDate: Custom start date (ISO string, requires endDate)
 * - endDate: Custom end date (ISO string, requires startDate)
 * 
 * Response includes:
 * - Per-product earnings data with profit calculations
 * - Size variant breakdown
 * - Summary totals
 * 
 * Only includes orders that are:
 * - Not cancelled
 * - Payment completed
 * 
 * @example GET /api/products/earnings?dateRange=months
 * @example GET /api/products/earnings?startDate=2024-01-01&endDate=2024-03-31
 * 
 * @param request - HTTP request with query parameters
 * @returns Product earnings data and summary
 */
export async function GET(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // PARSE QUERY PARAMETERS
    // -------------------------------------------------------------------------
    
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'all'
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    /**
     * Date filter type: 'order' for order.createdAt, 'payment' for paymentReceivedDate
     * Defaults to 'payment' for earnings (cash flow reporting standard)
     */
    const dateFilterType = searchParams.get('dateFilterType') || 'payment'

    // -------------------------------------------------------------------------
    // CALCULATE DATE RANGE
    // -------------------------------------------------------------------------
    
    const now = new Date()
    now.setHours(23, 59, 59, 999) // End of today
    let startDate: Date | undefined
    let endDate: Date = now

    /**
     * Priority:
     * 1. Custom dates (if both provided)
     * 2. Preset date range
     * 3. No filter (all time)
     */
    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      switch (dateRange) {
        case 'today':
          // Today only
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          break
          
        case 'weeks':
          // Last 7 days
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          break
          
        case 'months':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
          break
          
        case 'quarter':
        case 'custom':
          // Handled by custom dates above
          break
      }
    }

    // -------------------------------------------------------------------------
    // FETCH PRODUCTS WITH ORDER DATA
    // -------------------------------------------------------------------------
    
    /**
     * Get ALL products that have payment-completed orders (including hidden/deleted products)
     * 
     * Market Standard: Earnings reports must include ALL products that had sales,
     * even if the product is later hidden or deleted. This ensures:
     * - Complete historical accuracy
     * - No missing revenue in reports
     * - Accounting compliance (all sales must be reported)
     * 
     * Filter order items to only include:
     * - Non-cancelled orders
     * - Paid orders (payment_completed)
     * - Within date range (if specified)
     * 
     * Note: We don't filter by isHidden because earnings must show all historical sales,
     * regardless of current product status. A product can be removed from menu but
     * its past sales must still appear in earnings reports.
     */
    const products = await prisma.product.findMany({
      where: {
        // Include ALL products (even hidden/deleted) that have order items
        // This ensures historical sales are always included in earnings reports
      },
      include: {
        orderItems: {
          where: {
            order: {
              status: {
                not: 'cancelled',
              },
              paymentStatus: 'payment_completed',
              /**
               * Date filtering logic:
               * - If date range is specified, filter by selected date type (order date or payment date)
               * - If date range is "All Time", include ALL payment_completed orders
               * 
               * dateFilterType options:
               * - 'payment': Filter by paymentReceivedDate (default for earnings)
               * - 'order': Filter by order.createdAt
               * 
               * Backward compatibility:
               * - For payment date filtering, include orders without paymentReceivedDate
               *   using createdAt as fallback (old orders compatibility)
               */
              ...(startDate && {
                ...(dateFilterType === 'payment'
                  ? {
                      // Filter by payment date (with fallback to order date for old orders)
                      OR: [
                        // Orders with paymentReceivedDate set - filter by it
                        {
                          paymentReceivedDate: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                        // Orders without paymentReceivedDate (old orders) - use createdAt as fallback
                        {
                          paymentReceivedDate: null,
                          createdAt: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                      ],
                    }
                  : {
                      // Filter by order creation date
                      createdAt: {
                        gte: startDate,
                        lte: endDate,
                      },
                    }),
              }),
            },
          },
          include: {
            order: {
              select: {
                paymentReceivedDate: true,
                createdAt: true, // Include for reference
              },
            },
          },
        },
      },
    })

    // -------------------------------------------------------------------------
    // CALCULATE EARNINGS PER PRODUCT
    // -------------------------------------------------------------------------
    
    /**
     * Filter out products with no matching order items
     * (products that don't meet the date/payment criteria)
     * Only include products that actually have sales in the selected period
     */
    const productsWithOrders = products.filter(
      (product) => product.orderItems && product.orderItems.length > 0
    )
    
    /**
     * Calculate earnings per product
     * Includes ALL products that had orders (even hidden/deleted products)
     * This ensures complete historical accuracy in earnings reports
     */
    const productEarnings = productsWithOrders.map((product) => {
      // Calculate totals from order items
      const totalQuantity = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      const totalEarnings = product.orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      )

      /**
       * Calculate size breakdown and spending
       * Track earnings and costs per size variant
       */
      const sizeBreakdown: Record<string, { 
        quantity: number
        earnings: number
        spending: number 
      }> = {}
      let totalSpending = 0
      
      // Get spending configuration
      const spendingVariants = (product.spendingVariants as Record<string, number>) || {}
      const productVariants = (product.variants as Record<string, number>) || {}
      
      /**
       * Initialize breakdown with all available variants
       * This allows admin to see all sizes even if not sold yet
       */
      if (productVariants && Object.keys(productVariants).length > 0) {
        Object.keys(productVariants).forEach((size) => {
          if (!sizeBreakdown[size]) {
            sizeBreakdown[size] = { quantity: 0, earnings: 0, spending: 0 }
          }
        })
      }
      
      /**
       * Process actual order items
       * Calculate earnings and spending per size
       */
      product.orderItems.forEach((item) => {
        const size = item.selectedSize || product.unit
        
        // Initialize size bucket if needed
        if (!sizeBreakdown[size]) {
          sizeBreakdown[size] = { quantity: 0, earnings: 0, spending: 0 }
        }
        
        // Add to size totals
        sizeBreakdown[size].quantity += item.quantity
        sizeBreakdown[size].earnings += item.subtotal
        
        // Calculate spending (cost) for this size
        // Use variant-specific spending or fall back to base spending
        const spendingPerUnit = spendingVariants[size] || product.spending || 0
        const sizeSpending = spendingPerUnit * item.quantity
        sizeBreakdown[size].spending += sizeSpending
        totalSpending += sizeSpending
      })
      
      // Calculate profit (earnings minus costs)
      const profit = totalEarnings - totalSpending

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit,
        spending: product.spending || 0,
        spendingVariants: spendingVariants,
        totalQuantity,
        totalEarnings,
        totalSpending,
        profit,
        orderCount: product.orderItems.length,
        sizeBreakdown,
      }
    })

    // -------------------------------------------------------------------------
    // SORT AND PREPARE RESPONSE
    // -------------------------------------------------------------------------
    
    // Sort by earnings (highest first)
    productEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings)

    return NextResponse.json({
      products: productEarnings,
      dateRange,
      summary: {
        totalEarnings: productEarnings.reduce(
          (sum, p) => sum + p.totalEarnings,
          0
        ),
        totalSpending: productEarnings.reduce(
          (sum, p) => sum + p.totalSpending,
          0
        ),
        totalProfit: productEarnings.reduce(
          (sum, p) => sum + p.profit, 
          0
        ),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate earnings' },
      { status: 500 }
    )
  }
}
