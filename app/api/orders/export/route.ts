/**
 * ============================================================================
 * ORDERS EXPORT API ROUTE
 * ============================================================================
 * Admin endpoint for exporting orders to Excel spreadsheet.
 * 
 * Endpoints:
 * - GET /api/orders/export - Download orders as Excel file
 * 
 * Features:
 * - Multiple date range options (today, week, month, 3 months, quarter)
 * - Custom date range support
 * - Filter by order status
 * - Filter by payment status
 * - Dynamic filename based on filters
 * 
 * Access Control:
 * - Admin only - Regular users cannot export orders
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exportOrdersToExcel } from '@/lib/export'

// =============================================================================
// GET - EXPORT ORDERS TO EXCEL
// =============================================================================

/**
 * Generate and download orders Excel report
 * 
 * Query Parameters:
 * - status: Filter by order status (pending/processing/completed/cancelled)
 * - paymentStatus: Filter by payment status (payment_pending/payment_completed)
 * - dateRange: Preset date range (today/weeks/months/months3/quarter/all)
 * - startDate: Custom start date (ISO string, requires endDate)
 * - endDate: Custom end date (ISO string, requires startDate)
 * 
 * @example GET /api/orders/export?status=completed&dateRange=months
 * @example GET /api/orders/export?startDate=2024-01-01&endDate=2024-03-31
 * 
 * @param request - HTTP request with query parameters
 * @returns Excel file download
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
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const dateRange = searchParams.get('dateRange')
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')

    // -------------------------------------------------------------------------
    // CALCULATE DATE RANGE
    // -------------------------------------------------------------------------
    
    let startDate: Date | undefined
    let endDate: Date | undefined = new Date()

    /**
     * Priority:
     * 1. Custom dates (if both provided)
     * 2. Preset date range
     * 3. No filter (all orders)
     */
    if (customStartDate && customEndDate) {
      // Custom date range
      startDate = new Date(customStartDate)
      startDate.setHours(0, 0, 0, 0) // Start of day
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999) // End of day
    } else if (dateRange) {
      const now = new Date()
      now.setHours(23, 59, 59, 999) // End of today
      
      switch (dateRange) {
        case 'today':
          // Today only (midnight to midnight)
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'weeks':
          // Last 7 days (including today)
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'months':
          // Current month (1st to today)
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'months3':
          // Last 3 months
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'quarter':
          // This will be handled by custom dates from frontend
          break
      }
    }

    // -------------------------------------------------------------------------
    // GENERATE EXCEL FILE
    // -------------------------------------------------------------------------
    
    const buffer = await exportOrdersToExcel(
      startDate,
      endDate,
      status || undefined,
      paymentStatus || undefined
    )

    // -------------------------------------------------------------------------
    // GENERATE DYNAMIC FILENAME
    // -------------------------------------------------------------------------
    
    const today = new Date()
    const year = today.getFullYear()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[today.getMonth()]
    const day = today.getDate()
    
    /**
     * Generate ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
     */
    const getOrdinalSuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th' // Special case for 11th-13th
      switch (d % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
      }
    }
    
    const datePrefix = `${month}${day}${getOrdinalSuffix(day)}`
    let filename = ''
    
    // Determine status suffix for filename
    let statusSuffix = ''
    if (status === 'completed') {
      statusSuffix = 'completeOrders'
    } else if (status === 'pending') {
      statusSuffix = 'pendingOrder'
    } else if (status === 'processing') {
      statusSuffix = 'processingOrder'
    } else {
      statusSuffix = 'allOrders'
    }
    
    /**
     * Build filename based on status and date range
     * Format: [DatePrefix]_[Status]_report.xlsx
     * Examples:
     * - Jan15th_completeOrders_report.xlsx
     * - Jan15thWeek_pendingOrder_report.xlsx
     * - Jan_allOrders_report.xlsx
     */
    if (status === 'completed') {
      if (dateRange === 'all') {
        filename = `completeOrders_report.xlsx`
      } else if (dateRange === 'today') {
        filename = `${datePrefix}_completeOrders_report.xlsx`
      } else if (dateRange === 'weeks') {
        filename = `${datePrefix}Week_completeOrders_report.xlsx`
      } else if (dateRange === 'months') {
        filename = `${month}_completeOrders_report.xlsx`
      } else if (dateRange === 'months3') {
        filename = `ThreeMonths_completeOrders_report.xlsx`
      } else if (dateRange === 'quarter') {
        filename = `Quarter_completeOrders_report.xlsx`
      } else {
        filename = `completeOrders_report.xlsx`
      }
    } else if (status === 'pending') {
      if (dateRange === 'all') {
        filename = `AllPendingOrders_report.xlsx`
      } else if (dateRange === 'today') {
        filename = `${datePrefix}_pendingOrder_report.xlsx`
      } else if (dateRange === 'weeks') {
        filename = `${datePrefix}Week_pendingOrder_report.xlsx`
      } else if (dateRange === 'months') {
        filename = `${month}_pendingOrder_report.xlsx`
      } else if (dateRange === 'months3') {
        filename = `ThreeMonths_pendingOrder_report.xlsx`
      } else if (dateRange === 'quarter') {
        filename = `Quarter_pendingOrder_report.xlsx`
      } else {
        filename = `AllPendingOrders_report.xlsx`
      }
    } else if (status === 'processing') {
      if (dateRange === 'all') {
        filename = `AllProcessingOrders_report.xlsx`
      } else if (dateRange === 'today') {
        filename = `${datePrefix}_processingOrder_report.xlsx`
      } else if (dateRange === 'weeks') {
        filename = `${datePrefix}Week_processingOrder_report.xlsx`
      } else if (dateRange === 'months') {
        filename = `${month}_processingOrder_report.xlsx`
      } else if (dateRange === 'months3') {
        filename = `ThreeMonths_processingOrder_report.xlsx`
      } else if (dateRange === 'quarter') {
        filename = `Quarter_processingOrder_report.xlsx`
      } else {
        filename = `AllProcessingOrders_report.xlsx`
      }
    } else {
      // All orders (no status filter)
      if (dateRange === 'all') {
        filename = `AllOrders_report.xlsx`
      } else if (dateRange === 'today') {
        filename = `${datePrefix}_allOrders_report.xlsx`
      } else if (dateRange === 'weeks') {
        filename = `${datePrefix}Week_allOrders_report.xlsx`
      } else if (dateRange === 'months') {
        filename = `${month}_allOrders_report.xlsx`
      } else if (dateRange === 'months3') {
        filename = `ThreeMonths_allOrders_report.xlsx`
      } else if (dateRange === 'quarter') {
        filename = `Quarter_allOrders_report.xlsx`
      } else {
        filename = `AllOrders_report.xlsx`
      }
    }

    // -------------------------------------------------------------------------
    // RETURN EXCEL FILE RESPONSE
    // -------------------------------------------------------------------------
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
