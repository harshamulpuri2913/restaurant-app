/**
 * ============================================================================
 * EARNINGS EXPORT API ROUTE
 * ============================================================================
 * Admin endpoint for exporting product earnings to Excel spreadsheet.
 * 
 * Endpoints:
 * - GET /api/products/earnings/export - Download earnings report as Excel
 * 
 * Features:
 * - Export earnings data to Excel format
 * - Multiple date range options (today, week, month, quarter)
 * - Custom date range support
 * - Quarter detection for special naming
 * - Dynamic filename based on date range
 * - Includes product details, quantities, earnings, spending, and profit
 * 
 * Access Control:
 * - Admin only - Financial export restricted to administrators
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exportEarningsToExcel } from '@/lib/export'

// =============================================================================
// GET - EXPORT EARNINGS TO EXCEL
// =============================================================================

/**
 * Generate and download earnings Excel report
 * 
 * Query Parameters:
 * - dateRange: Preset date range (today/weeks/months/quarter/all)
 * - startDate: Custom start date (ISO string, requires endDate)
 * - endDate: Custom end date (ISO string, requires startDate)
 * 
 * The exported report includes:
 * - Product name and category
 * - Total quantity sold
 * - Size breakdown with earnings and spending
 * - Total earnings, spending, and profit
 * - Order count
 * - Summary row with totals
 * 
 * @example GET /api/products/earnings/export?dateRange=months
 * @example GET /api/products/earnings/export?startDate=2024-01-01&endDate=2024-03-31
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
    const dateRange = searchParams.get('dateRange') || 'all'
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    /**
     * Date filter type: 'order' for order.createdAt, 'payment' for paymentReceivedDate
     * Defaults to 'payment' for earnings (cash flow reporting standard)
     */
    const dateFilterType = (searchParams.get('dateFilterType') || 'payment') as 'order' | 'payment'

    // -------------------------------------------------------------------------
    // CALCULATE DATE RANGE
    // -------------------------------------------------------------------------
    
    let startDate: Date | undefined
    let endDate: Date | undefined = new Date()
    endDate.setHours(23, 59, 59, 999)
    
    /**
     * Track quarter information for special filename
     */
    let quarterInfo: { quarter: string; year: number } | null = null

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
      
      /**
       * Detect if custom date range is a quarter
       * This allows special quarter naming in filename
       */
      if (dateRange === 'quarter') {
        const start = new Date(customStartDate)
        const startMonth = start.getMonth()
        const year = start.getFullYear()
        const quarterNum = Math.floor(startMonth / 3) + 1
        quarterInfo = { quarter: `${quarterNum}`, year }
      } else {
        // Check if dates match quarter pattern (3 months at quarter boundary)
        const start = new Date(customStartDate)
        const end = new Date(customEndDate)
        const startMonth = start.getMonth()
        const endMonth = end.getMonth()
        const startDay = start.getDate()
        const year = start.getFullYear()
        
        // Quarter boundaries: Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec
        if (
          startDay === 1 &&
          ((startMonth === 0 && endMonth === 2) ||   // Q1: Jan-Mar
          (startMonth === 3 && endMonth === 5) ||    // Q2: Apr-Jun
          (startMonth === 6 && endMonth === 8) ||    // Q3: Jul-Sep
          (startMonth === 9 && endMonth === 11))     // Q4: Oct-Dec
        ) {
          const quarterNum = Math.floor(startMonth / 3) + 1
          quarterInfo = { quarter: `${quarterNum}`, year }
        }
      }
    } else if (dateRange !== 'all') {
      const now = new Date()
      now.setHours(23, 59, 59, 999)

      switch (dateRange) {
        case 'today':
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'weeks':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 6)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
          
        case 'months':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = now
          break
      }
    }

    // -------------------------------------------------------------------------
    // GENERATE EXCEL FILE
    // -------------------------------------------------------------------------
    
    /**
     * Export earnings to Excel with date filtering
     * Uses dateFilterType to filter by order date or payment date
     */
    const buffer = await exportEarningsToExcel(startDate, endDate, dateFilterType)

    // -------------------------------------------------------------------------
    // GENERATE DYNAMIC FILENAME
    // -------------------------------------------------------------------------
    
    const today = new Date()
    const year = today.getFullYear()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[today.getMonth()]
    const day = today.getDate()
    
    /**
     * Generate ordinal suffix for day
     * 1st, 2nd, 3rd, 4th, etc.
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
    
    /**
     * Build filename based on date range
     * Format varies by range type:
     * - Quarter: firstquarter_report.xlsx
     * - Today: 2024Jan15th_Earning report.xlsx
     * - Week: 2024Jan15thweek_earning.xlsx
     * - Month: 2024Jan_earning.xlsx
     * - All: 2024Jan15th_AllTime_earning.xlsx
     */
    let filename = ''
    
    if (quarterInfo) {
      // Quarter-specific filename
      const quarterNames: Record<string, string> = {
        '1': 'firstquarter',
        '2': 'secondquarter',
        '3': 'thirdquarter',
        '4': 'fourthquarter',
      }
      filename = `${quarterNames[quarterInfo.quarter]}_report.xlsx`
    } else if (dateRange === 'today') {
      filename = `${year}${month}${day}${getOrdinalSuffix(day)}_Earning report.xlsx`
    } else if (dateRange === 'weeks') {
      filename = `${year}${month}${day}${getOrdinalSuffix(day)}week_earning.xlsx`
    } else if (dateRange === 'months') {
      filename = `${year}${month}_earning.xlsx`
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      // Custom range shows start-end dates
      const start = new Date(customStartDate)
      const end = new Date(customEndDate)
      const startMonth = monthNames[start.getMonth()]
      const endMonth = monthNames[end.getMonth()]
      filename = `${year}${startMonth}${start.getDate()}${getOrdinalSuffix(start.getDate())}_to_${endMonth}${end.getDate()}${getOrdinalSuffix(end.getDate())}_earning.xlsx`
    } else {
      // All time
      filename = `${year}${month}${day}${getOrdinalSuffix(day)}_AllTime_earning.xlsx`
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
      { error: 'Failed to export earnings' },
      { status: 500 }
    )
  }
}
