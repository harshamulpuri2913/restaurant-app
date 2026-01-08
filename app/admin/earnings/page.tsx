/**
 * ============================================================================
 * EARNINGS & SPENDING PAGE
 * ============================================================================
 * Admin dashboard for viewing product earnings, spending, and profit.
 * 
 * Features:
 * - Product-wise earnings breakdown with size variants
 * - Total earnings, spending, and profit summary
 * - Date range filtering (all time, today, week, month, quarter, custom)
 * - Date filter type toggle (Order Date or Payment Date)
 * - Edit spending per product/size
 * - Export earnings to Excel
 * 
 * Financial Reporting:
 * - Earnings calculated from payment-completed orders
 * - Filtering by Order Date or Payment Date for accurate cash flow reporting
 * - Backward compatibility for old orders without paymentReceivedDate
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import ContactFooter from '@/components/ContactFooter'
import DateFilterTypeToggle from '../components/DateFilterTypeToggle'

interface ProductEarning {
  id: string
  name: string
  category: string
  price: number
  unit: string
  spending: number
  spendingVariants?: Record<string, number>
  totalQuantity: number
  totalEarnings: number
  totalSpending: number
  profit: number
  orderCount: number
  sizeBreakdown?: Record<string, { quantity: number; earnings: number; spending: number }>
}

interface EarningsData {
  products: ProductEarning[]
  dateRange: string
  summary: {
    totalEarnings: number
    totalSpending: number
    totalProfit: number
  }
}

export default function EarningsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<string>('all')
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null)
  const [dateFilterType, setDateFilterType] = useState<'order' | 'payment'>('payment') // Default to payment date for earnings
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editingSpending, setEditingSpending] = useState<string | null>(null)
  const [editingSpendingSize, setEditingSpendingSize] = useState<string | null>(null)
  const [spendingValue, setSpendingValue] = useState<number>(0)
  const [spendingVariants, setSpendingVariants] = useState<Record<string, number>>({})

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!session) {
      router.push('/signin')
      return
    }
    if (session.user.role !== 'admin') {
      router.push('/menu')
      return
    }
    fetchEarnings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, dateRange, customDateRange, dateFilterType])

  /**
   * Fetch earnings data from API
   * Includes date range and date filter type (order date or payment date)
   */
  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Add date range parameter
      if (dateRange !== 'all') {
        params.append('dateRange', dateRange)
      }
      
      // Add custom date range if selected (quarter or custom)
      if (customDateRange && customDateRange.start && customDateRange.end) {
        params.append('startDate', customDateRange.start)
        params.append('endDate', customDateRange.end)
      }
      
      // Add date filter type (order date or payment date)
      // Only needed when date range is not "All Time"
      if (dateRange !== 'all') {
        params.append('dateFilterType', dateFilterType)
      }
      
      const res = await fetch(`/api/products/earnings?${params.toString()}`)
      const data = await res.json()
      setEarningsData(data)
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
      toast.error('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Export earnings data to Excel
   * Includes same filters as displayed data (date range and date filter type)
   */
  const handleExportEarnings = async () => {
    try {
      const params = new URLSearchParams()
      
      // Add date range parameter
      if (dateRange !== 'all') {
        params.append('dateRange', dateRange)
      }
      
      // Add custom date range if selected (quarter or custom)
      if (customDateRange && customDateRange.start && customDateRange.end) {
        params.append('startDate', customDateRange.start)
        params.append('endDate', customDateRange.end)
      }
      
      // Add date filter type (order date or payment date)
      // Only needed when date range is not "All Time"
      if (dateRange !== 'all') {
        params.append('dateFilterType', dateFilterType)
      }

      const res = await fetch(`/api/products/earnings/export?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to export earnings')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Get filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'earnings.xlsx'
        : 'earnings.xlsx'

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Earnings report exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export earnings report')
    }
  }

  const handleUpdateSpending = async (productId: string, size?: string) => {
    try {
      // Ensure spendingValue is a valid number >= 0
      const spending = spendingValue >= 0 ? spendingValue : 0

      let body: any = {}

      if (size) {
        // Update spending for a specific size variant
        const currentVariants = spendingVariants || {}
        const updatedVariants = { ...currentVariants, [size]: spending }
        body.spendingVariants = updatedVariants
      } else {
        // Update base spending (for non-variant products)
        body.spending = spending
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to update spending')
      }

      toast.success('Spending updated successfully')
      setEditingSpending(null)
      setEditingSpendingSize(null)
      setSpendingValue(0)
      setSpendingVariants({})
      fetchEarnings()
    } catch (error) {
      console.error('Update spending error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update spending')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-golden text-2xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen textured-bg">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-4xl golden-text font-traditional">
              Earnings & Spending
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleExportEarnings}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors font-traditional flex items-center gap-2"
              >
                📊 Export Excel
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4 flex gap-4 items-center flex-wrap">
            <span className="text-light-gold font-traditional">Date Range:</span>
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'all'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('today')}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'today'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('weeks')}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'weeks'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('months')}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'months'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setDateRange('quarter')
                setShowDatePicker(true)
              }}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'quarter'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              Select Quarter
            </button>
            <button
              onClick={() => {
                setDateRange('custom')
                setShowDatePicker(true)
              }}
              className={`px-4 py-2 rounded-lg font-bold font-traditional ${dateRange === 'custom'
                  ? 'bg-golden text-deep-brown'
                  : 'bg-traditional-brown text-cream'
                }`}
            >
              📅 Custom Range
            </button>
          </div>

          {/* Date Filter Type Toggle - Separate row below date range for better clarity */}
          {/* Only shows when a specific date range is selected (not "All Time") */}
          <div className="mb-6 flex gap-4 items-center flex-wrap">
            <DateFilterTypeToggle
              dateFilterType={dateFilterType}
              onDateFilterTypeChange={setDateFilterType}
              dateRange={dateRange}
            />
          </div>

          {/* Quarter Selection */}
          {dateRange === 'quarter' && showDatePicker && (
            <div className="mb-6 p-4 bg-deep-brown traditional-border rounded-lg">
              <h3 className="text-light-gold font-traditional mb-3">Select Quarter:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Q1 (Jan-Mar)', value: 'Q1', start: 0, end: 2 },
                  { label: 'Q2 (Apr-Jun)', value: 'Q2', start: 3, end: 5 },
                  { label: 'Q3 (Jul-Sep)', value: 'Q3', start: 6, end: 8 },
                  { label: 'Q4 (Oct-Dec)', value: 'Q4', start: 9, end: 11 },
                ].map((quarter) => {
                  const today = new Date()
                  const currentYear = today.getFullYear()
                  const startDate = new Date(currentYear, quarter.start, 1)
                  const endDate = new Date(currentYear, quarter.end + 1, 0, 23, 59, 59, 999)

                  return (
                    <button
                      key={quarter.value}
                      onClick={() => {
                        setCustomDateRange({
                          start: startDate.toISOString().split('T')[0],
                          end: endDate.toISOString().split('T')[0],
                        })
                        setShowDatePicker(false)
                        fetchEarnings()
                      }}
                      className="bg-traditional-brown text-cream px-4 py-3 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                    >
                      {quarter.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && showDatePicker && (
            <div className="mb-6 p-4 bg-deep-brown traditional-border rounded-lg">
              <h3 className="text-light-gold font-traditional mb-3">Select Date Range (Last 6 Months):</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-light-gold text-sm mb-2 font-traditional">Start Date:</label>
                  <input
                    type="date"
                    value={customDateRange?.start || ''}
                    onChange={(e) => {
                      const sixMonthsAgo = new Date()
                      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
                      const maxDate = new Date().toISOString().split('T')[0]
                      const minDate = sixMonthsAgo.toISOString().split('T')[0]

                      if (e.target.value < minDate) {
                        toast.error('Date cannot be more than 6 months ago')
                        return
                      }

                      setCustomDateRange({
                        start: e.target.value,
                        end: customDateRange?.end || maxDate,
                      })
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    min={(() => {
                      const sixMonthsAgo = new Date()
                      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
                      return sixMonthsAgo.toISOString().split('T')[0]
                    })()}
                    className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-golden"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-light-gold text-sm mb-2 font-traditional">End Date:</label>
                  <input
                    type="date"
                    value={customDateRange?.end || ''}
                    onChange={(e) => {
                      setCustomDateRange({
                        start: customDateRange?.start || '',
                        end: e.target.value,
                      })
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    min={customDateRange?.start || ''}
                    className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream focus:outline-none focus:ring-2 focus:ring-golden"
                  />
                </div>
                <button
                  onClick={() => {
                    if (customDateRange?.start && customDateRange?.end) {
                      setShowDatePicker(false)
                      fetchEarnings()
                    } else {
                      toast.error('Please select both start and end dates')
                    }
                  }}
                  className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowDatePicker(false)
                    setCustomDateRange(null)
                    setDateRange('all')
                    fetchEarnings()
                  }}
                  className="bg-traditional-brown text-cream px-6 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Show selected date range info */}
          {customDateRange && (dateRange === 'quarter' || dateRange === 'custom') && (
            <div className="mb-4 p-3 bg-traditional-brown rounded-lg">
              <p className="text-cream text-sm font-traditional">
                📅 Selected Range: {new Date(customDateRange.start).toLocaleDateString()} to {new Date(customDateRange.end).toLocaleDateString()}
                <button
                  onClick={() => {
                    setCustomDateRange(null)
                    setDateRange('all')
                    setShowDatePicker(false)
                    fetchEarnings()
                  }}
                  className="ml-3 text-red-400 hover:text-red-300 text-xs underline"
                >
                  Clear
                </button>
              </p>
            </div>
          )}

          {/* Summary Cards */}
          {earningsData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="traditional-border bg-deep-brown p-6 rounded-lg">
                <h3 className="text-light-gold text-sm mb-2 font-traditional">
                  Total Earnings
                </h3>
                <p className="text-3xl golden-text font-bold">
                  ${earningsData.summary.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="traditional-border bg-deep-brown p-6 rounded-lg">
                <h3 className="text-light-gold text-sm mb-2 font-traditional">
                  Total Spending
                </h3>
                <p className="text-3xl text-red-400 font-bold">
                  ${earningsData.summary.totalSpending.toFixed(2)}
                </p>
              </div>
              <div className="traditional-border bg-deep-brown p-6 rounded-lg">
                <h3 className="text-light-gold text-sm mb-2 font-traditional">
                  Net Profit
                </h3>
                <p
                  className={`text-3xl font-bold ${earningsData.summary.totalProfit >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                    }`}
                >
                  ${earningsData.summary.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Products Table */}
          {earningsData && earningsData.products.length > 0 ? (
            <div className="traditional-border bg-deep-brown rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-traditional-brown">
                    <tr>
                      <th className="px-4 py-3 text-left text-light-gold font-traditional">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-light-gold font-traditional">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-light-gold font-traditional">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        Quantity Sold
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        <div className="flex flex-col items-end">
                          <span>Spending per Unit</span>
                          <span className="text-xs text-light-gold opacity-75 mt-1">
                            (varies by size)
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        Total Earnings
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        Total Spending
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        Profit
                      </th>
                      <th className="px-4 py-3 text-right text-light-gold font-traditional">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData.products.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-t border-golden border-opacity-30 hover:bg-traditional-brown transition-colors"
                      >
                        <td className="px-4 py-3 text-cream font-bold">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 text-cream font-bold">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-light-gold capitalize">
                          {product.category}
                        </td>
                        <td className="px-4 py-3 text-right text-cream">
                          <div className="flex flex-col items-end gap-1">
                            {product.sizeBreakdown && Object.keys(product.sizeBreakdown).length > 1 ? (
                              // Show breakdown if multiple sizes
                              Object.entries(product.sizeBreakdown)
                                .sort(([a], [b]) => {
                                  // Sort sizes: 1kg > 500gm > 250gm > others
                                  const order: Record<string, number> = {
                                    '1kg': 1000,
                                    '500gm': 500,
                                    '500g': 500,
                                    '250gm': 250,
                                    '250g': 250,
                                    'full tray': 3,
                                    'half tray': 2,
                                    'family pack': 1,
                                  }
                                  return (order[b.toLowerCase()] || 0) - (order[a.toLowerCase()] || 0)
                                })
                                .map(([size, data]) => (
                                  <div key={size} className="text-sm">
                                    <span className="font-bold">{data.quantity}</span>
                                    <span className="mx-1">-</span>
                                    <span className="text-light-gold">{size}</span>
                                    <span className="text-xs text-light-gold ml-1">
                                      (${data.earnings.toFixed(2)})
                                    </span>
                                  </div>
                                ))
                            ) : (
                              // Show simple total if single size or no breakdown
                              <div>
                                <span className="font-bold">{product.totalQuantity}</span>
                                <span className="mx-1">-</span>
                                <span className="text-light-gold">
                                  {product.sizeBreakdown
                                    ? Object.keys(product.sizeBreakdown)[0] || product.unit
                                    : product.unit
                                  }
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-light-gold mt-1">
                              Total: {product.totalQuantity} units
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {product.sizeBreakdown && Object.keys(product.sizeBreakdown).length > 1 ? (
                            // Multiple sizes - show spending per size
                            <div className="flex flex-col items-end gap-2">
                              {Object.entries(product.sizeBreakdown)
                                .sort(([a], [b]) => {
                                  const order: Record<string, number> = {
                                    '1kg': 1000, '500gm': 500, '500g': 500,
                                    '250gm': 250, '250g': 250,
                                    'full tray': 3, 'half tray': 2, 'family pack': 1,
                                  }
                                  return (order[b.toLowerCase()] || 0) - (order[a.toLowerCase()] || 0)
                                })
                                .map(([size, data]) => {
                                  const isEditing = editingSpending === product.id && editingSpendingSize === size
                                  const currentSpending = product.spendingVariants?.[size] || product.spending || 0

                                  return (
                                    <div key={size} className="flex items-center gap-2">
                                      <span className="text-xs text-light-gold min-w-[50px] text-right">{size}:</span>
                                      {isEditing ? (
                                        <>
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            value={spendingValue === 0 && spendingValue !== currentSpending ? '' : spendingValue.toString()}
                                            onChange={(e) => {
                                              const value = e.target.value.trim()
                                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                if (value === '') {
                                                  setSpendingValue(0)
                                                } else {
                                                  const numValue = parseFloat(value)
                                                  if (!isNaN(numValue) && numValue >= 0) {
                                                    setSpendingValue(numValue)
                                                  }
                                                }
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                e.preventDefault()
                                              }
                                              if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleUpdateSpending(product.id, size)
                                              }
                                            }}
                                            className="w-20 px-2 py-1 bg-deep-brown border border-golden rounded text-cream text-sm focus:outline-none focus:ring-2 focus:ring-golden"
                                            placeholder="0.00"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => handleUpdateSpending(product.id, size)}
                                            className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-700"
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingSpending(null)
                                              setEditingSpendingSize(null)
                                              setSpendingValue(0)
                                            }}
                                            className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-700"
                                          >
                                            ✗
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-cream text-sm min-w-[50px] text-right">
                                            ${currentSpending.toFixed(2)}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setEditingSpending(product.id)
                                              setEditingSpendingSize(size)
                                              setSpendingValue(currentSpending)
                                              setSpendingVariants(product.spendingVariants || {})
                                            }}
                                            className="bg-golden text-deep-brown px-2 py-1 rounded text-xs font-bold hover:bg-light-gold"
                                          >
                                            Edit
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )
                                })}
                            </div>
                          ) : (
                            // Single size or no variants - show simple spending
                            editingSpending === product.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={spendingValue === 0 ? '' : spendingValue.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value.trim()
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                      if (value === '') {
                                        setSpendingValue(0)
                                      } else {
                                        const numValue = parseFloat(value)
                                        if (!isNaN(numValue) && numValue >= 0) {
                                          setSpendingValue(numValue)
                                        }
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleUpdateSpending(product.id)
                                    }
                                  }}
                                  className="w-24 px-2 py-1 bg-deep-brown border border-golden rounded text-cream focus:outline-none focus:ring-2 focus:ring-golden"
                                  placeholder="0.00"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateSpending(product.id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-700"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSpending(null)
                                    setSpendingValue(0)
                                  }}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-700"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-cream">
                                  ${product.spending.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingSpending(product.id)
                                    setSpendingValue(product.spending)
                                  }}
                                  className="bg-golden text-deep-brown px-2 py-1 rounded text-xs font-bold hover:bg-light-gold"
                                >
                                  Edit
                                </button>
                              </div>
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-bold">
                          ${product.totalEarnings.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 font-bold">
                          ${product.totalSpending.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${product.profit >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                        >
                          ${product.profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-cream">
                          {product.orderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="traditional-border bg-deep-brown p-8 rounded-lg text-center">
              <p className="text-cream text-xl">No orders found for this period</p>
            </div>
          )}
        </div>
      </div>
      <ContactFooter />
    </div>
  )
}

