/**
 * ============================================================================
 * EXPORT UTILITIES
 * ============================================================================
 * Excel export functionality for orders and earnings reports.
 * 
 * Features:
 * - Export orders to Excel with filtering options
 * - Export earnings/sales reports by product
 * - Size variant breakdown in reports
 * - Summary calculations (totals, profit margins)
 * - Custom column widths for readability
 * 
 * Dependencies:
 * - xlsx: Excel file generation library
 * - prisma: Database access
 * 
 * Usage:
 * ```typescript
 * import { exportOrdersToExcel, exportEarningsToExcel } from '@/lib/export'
 * 
 * const buffer = await exportOrdersToExcel(startDate, endDate, 'delivered')
 * ```
 */

import * as XLSX from 'xlsx'
import { prisma } from './prisma'

// =============================================================================
// ORDERS EXPORT
// =============================================================================

/**
 * Export orders to Excel spreadsheet
 * 
 * Generates an Excel file containing order data with optional filtering.
 * Includes customer info, order items, payment status, and totals.
 * 
 * @param startDate - Optional start date filter (inclusive)
 * @param endDate - Optional end date filter (inclusive)
 * @param status - Optional order status filter (pending, confirmed, delivered, cancelled)
 * @param paymentStatus - Optional payment status filter (pending, payment_completed)
 * @returns Buffer containing Excel file data
 * 
 * @example
 * // Export all orders from last month
 * const lastMonth = new Date()
 * lastMonth.setMonth(lastMonth.getMonth() - 1)
 * const buffer = await exportOrdersToExcel(lastMonth, new Date())
 * 
 * // Export only delivered orders
 * const buffer = await exportOrdersToExcel(undefined, undefined, 'delivered')
 */
export async function exportOrdersToExcel(
  startDate?: Date, 
  endDate?: Date,
  status?: string,
  paymentStatus?: string
) {
  // ---------------------------------------------------------------------------
  // BUILD QUERY FILTERS
  // ---------------------------------------------------------------------------
  
  const where: any = {}
  
  // Date range filter
  if (startDate || endDate) {
    where.paymentReceivedDate = {}
    if (startDate) where.paymentReceivedDate.gte = startDate
    if (endDate) where.paymentReceivedDate.lte = endDate
  }

  // Order status filter
  if (status) {
    where.status = status
  }

  // Payment status filter
  if (paymentStatus) {
    where.paymentStatus = paymentStatus
  }

  // ---------------------------------------------------------------------------
  // FETCH ORDERS WITH RELATED DATA
  // ---------------------------------------------------------------------------
  
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        }
      },
      items: {
        include: {
          product: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc', // Sort by date (newest first)
    }
  })

  // ---------------------------------------------------------------------------
  // FORMAT DATA FOR EXCEL
  // ---------------------------------------------------------------------------
  
  /**
   * Transform order data into flat rows for Excel
   * Each row contains all order information in a readable format
   */
  const excelData = orders.map(order => ({
    'Order ID': order.id,
    'Date': new Date(order.createdAt).toLocaleString(),
    'Customer Name': order.customerName || order.user.name || 'N/A',
    'Customer Email': order.customerEmail || order.user.email || 'N/A',
    'Customer Phone': order.customerPhone || order.user.phone || 'N/A',
    'Status': order.status,
    'Payment Status': order.paymentStatus === 'payment_completed' ? 'Completed' : 'Pending',
    'Location': order.location || 'N/A',
    'Pickup Date': order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : 'N/A',
    'Items': order.items.map(item => 
      `${item.product.name} (${item.quantity}x)`
    ).join(', '),
    'Total Amount': order.totalAmount,
    'WhatsApp Sent': order.whatsappSent ? 'Yes' : 'No',
  }))

  // ---------------------------------------------------------------------------
  // CREATE EXCEL WORKBOOK
  // ---------------------------------------------------------------------------
  
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 25 }, // Order ID
    { wch: 20 }, // Date
    { wch: 20 }, // Customer Name
    { wch: 25 }, // Customer Email
    { wch: 15 }, // Customer Phone
    { wch: 12 }, // Status
    { wch: 15 }, // Payment Status
    { wch: 15 }, // Location
    { wch: 15 }, // Pickup Date
    { wch: 50 }, // Items
    { wch: 12 }, // Total Amount
    { wch: 12 }, // WhatsApp Sent
  ]
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
  
  // Generate binary buffer for file download
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  return buffer
}

/**
 * Export orders in Google Sheets compatible format
 * 
 * Wrapper function that returns data in a format
 * easily importable to Google Sheets.
 * 
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Buffer containing Excel file data
 */
export async function exportOrdersToGoogleSheetsFormat(startDate?: Date, endDate?: Date) {
  // Uses same format as Excel export - compatible with Google Sheets import
  const orders = await exportOrdersToExcel(startDate, endDate)
  return orders
}

// =============================================================================
// EARNINGS EXPORT
// =============================================================================

/**
 * Export earnings report to Excel
 * 
 * Generates a comprehensive earnings report including:
 * - Per-product sales data
 * - Size variant breakdown
 * - Spending vs earnings (profit calculation)
 * - Summary totals
 * 
 * Only includes completed, non-cancelled orders in calculations.
 * 
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param dateFilterType - Filter by 'order' (order.createdAt) or 'payment' (paymentReceivedDate)
 *                         Defaults to 'payment' for cash flow reporting
 * @returns Buffer containing Excel file data
 * 
 * @example
 * // Export earnings for Q1 2024 filtered by payment date
 * const q1Start = new Date('2024-01-01')
 * const q1End = new Date('2024-03-31')
 * const buffer = await exportEarningsToExcel(q1Start, q1End, 'payment')
 */
export async function exportEarningsToExcel(
  startDate?: Date,
  endDate?: Date,
  dateFilterType: 'order' | 'payment' = 'payment'
) {
  // ---------------------------------------------------------------------------
  // BUILD DATE FILTER
  // ---------------------------------------------------------------------------
  
  const where: any = {}
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  // ---------------------------------------------------------------------------
  // FETCH PRODUCTS WITH ORDER ITEMS
  // ---------------------------------------------------------------------------
  
  /**
   * Get ALL products that have payment-completed orders (including hidden/deleted products)
   * 
   * Market Standard: Earnings exports must include ALL products that had sales,
   * even if the product is later hidden or deleted. This ensures:
   * - Complete historical accuracy in exports
   * - No missing revenue in reports
   * - Accounting compliance (all sales must be reported)
   * 
   * Note: We don't filter by isHidden because earnings must show all historical sales,
   * regardless of current product status. A product can be removed from menu but
   * its past sales must still appear in earnings exports.
   */
  const products = await prisma.product.findMany({
    where: {
      // Include ALL products (even hidden/deleted) that have order items
      // This ensures historical sales are always included in earnings exports
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
             * - If date range is not specified ("All Time"), include ALL payment_completed orders
             * 
             * dateFilterType options:
             * - 'payment': Filter by paymentReceivedDate (default for earnings)
             * - 'order': Filter by order.createdAt
             * 
             * Backward compatibility:
             * - For payment date filtering, include orders without paymentReceivedDate
             *   using createdAt as fallback (old orders compatibility)
             */
            ...(startDate || endDate ? {
              ...(dateFilterType === 'payment'
                ? {
                    // Filter by payment date (with fallback to order date for old orders)
                    OR: [
                      // Orders with paymentReceivedDate set - filter by it
                      {
                        paymentReceivedDate: {
                          ...(startDate ? { gte: startDate } : {}),
                          ...(endDate ? { lte: endDate } : {}),
                        },
                      },
                      // Orders without paymentReceivedDate (old orders) - use createdAt as fallback
                      {
                        paymentReceivedDate: null,
                        createdAt: {
                          ...(startDate ? { gte: startDate } : {}),
                          ...(endDate ? { lte: endDate } : {}),
                        },
                      },
                    ],
                  }
                : {
                    // Filter by order creation date
                    createdAt: {
                      ...(startDate ? { gte: startDate } : {}),
                      ...(endDate ? { lte: endDate } : {}),
                    },
                  }),
            } : {}),
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

  // ---------------------------------------------------------------------------
  // CALCULATE EARNINGS PER PRODUCT
  // ---------------------------------------------------------------------------
  
  /**
   * Filter out products with no matching order items
   * (products that don't meet the date/payment criteria)
   * Only include products that actually have sales in the selected period
   */
  const productsWithOrders = products.filter(
    (product) => product.orderItems && product.orderItems.length > 0
  )
  
  /**
   * Calculate earnings per product for Excel export
   * Includes ALL products that had orders (even hidden/deleted products)
   * This ensures complete historical accuracy in earnings exports
   */
  const excelData = productsWithOrders.map((product) => {
    // Get spending variants (cost per size)
    const spendingVariants = (product.spendingVariants as Record<string, number>) || {}
    
    // Group sales by size variant
    const sizeBreakdown: Record<string, { quantity: number; earnings: number; spending: number }> = {}
    let totalQuantity = 0
    let totalEarnings = 0
    let totalSpending = 0
    
    // Process each order item
    product.orderItems.forEach((item) => {
      const size = item.selectedSize || product.unit
      
      // Initialize size bucket if needed
      if (!sizeBreakdown[size]) {
        sizeBreakdown[size] = { quantity: 0, earnings: 0, spending: 0 }
      }
      
      // Add quantity and earnings
      sizeBreakdown[size].quantity += item.quantity
      sizeBreakdown[size].earnings += item.subtotal
      
      // Calculate spending (cost) for this item
      const spendingPerUnit = spendingVariants[size] || product.spending || 0
      const sizeSpending = spendingPerUnit * item.quantity
      sizeBreakdown[size].spending += sizeSpending
      
      // Accumulate totals
      totalQuantity += item.quantity
      totalEarnings += item.subtotal
      totalSpending += sizeSpending
    })
    
    // Calculate profit (earnings - spending)
    const profit = totalEarnings - totalSpending
    
    /**
     * Format size breakdown as readable string
     * Sort by size (largest first) for consistency
     */
    const sizeDetails = Object.entries(sizeBreakdown)
      .sort(([a], [b]) => {
        // Size ordering map (higher = larger)
        const order: Record<string, number> = {
          '1kg': 1000, '500gm': 500, '500g': 500,
          '250gm': 250, '250g': 250,
          'full tray': 3, 'half tray': 2, 'family pack': 1,
        }
        return (order[b.toLowerCase()] || 0) - (order[a.toLowerCase()] || 0)
      })
      .map(([size, data]) => 
        `${size}: ${data.quantity} units (Earnings: $${data.earnings.toFixed(2)}, Spending: $${data.spending.toFixed(2)})`
      )
      .join('; ')
    
    return {
      'Product Name': product.name,
      'Category': product.category,
      'Total Quantity Sold': totalQuantity,
      'Size Breakdown': sizeDetails || 'N/A',
      'Spending per Unit': product.spending ? `$${product.spending.toFixed(2)}` : 'N/A',
      'Total Earnings': totalEarnings,
      'Total Spending': totalSpending,
      'Profit': profit,
      'Orders': product.orderItems.length,
    }
  })
  
  // Sort by earnings (highest first)
  excelData.sort((a, b) => (b['Total Earnings'] as number) - (a['Total Earnings'] as number))
  
  // ---------------------------------------------------------------------------
  // ADD SUMMARY ROW
  // ---------------------------------------------------------------------------
  
  /**
   * Calculate totals across all products
   */
  const summary = {
    'Product Name': 'SUMMARY',
    'Category': '',
    'Total Quantity Sold': excelData.reduce((sum, p) => sum + (p['Total Quantity Sold'] as number), 0),
    'Size Breakdown': '',
    'Spending per Unit': '',
    'Total Earnings': excelData.reduce((sum, p) => sum + (p['Total Earnings'] as number), 0),
    'Total Spending': excelData.reduce((sum, p) => sum + (p['Total Spending'] as number), 0),
    'Profit': excelData.reduce((sum, p) => sum + (p['Profit'] as number), 0),
    'Orders': excelData.reduce((sum, p) => sum + (p['Orders'] as number), 0),
  }
  
  // ---------------------------------------------------------------------------
  // CREATE EXCEL WORKBOOK
  // ---------------------------------------------------------------------------
  
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet([...excelData, summary])
  
  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 25 }, // Product Name
    { wch: 15 }, // Category
    { wch: 18 }, // Total Quantity Sold
    { wch: 60 }, // Size Breakdown
    { wch: 18 }, // Spending per Unit
    { wch: 15 }, // Total Earnings
    { wch: 15 }, // Total Spending
    { wch: 15 }, // Profit
    { wch: 10 }, // Orders
  ]
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Earnings Report')
  
  // Generate binary buffer for file download
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  return buffer
}
