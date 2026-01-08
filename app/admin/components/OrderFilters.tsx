/**
 * ============================================================================
 * ORDER FILTERS COMPONENT
 * ============================================================================
 * Filter controls for the admin orders list.
 * Allows filtering by status, payment status, and date range.
 * 
 * Features:
 * - Status filter (all, pending, processing, completed)
 * - Payment status filter (visible only for completed orders)
 * - Date range filter (all time, today, this week, this month, 3 months)
 * - Date filter type toggle (order date or payment date) - uses reusable component
 */

'use client'

import { DateRange } from '@/types'
import DateFilterTypeToggle from './DateFilterTypeToggle'

interface OrderFiltersProps {
  /** Current status filter */
  filter: string
  /** Current payment filter */
  paymentFilter: string
  /** Current date range */
  dateRange: DateRange
  /** Current date filter type - 'order' or 'payment' */
  dateFilterType: 'order' | 'payment'
  /** Callback when status filter changes */
  onFilterChange: (filter: string) => void
  /** Callback when payment filter changes */
  onPaymentFilterChange: (filter: string) => void
  /** Callback when date range changes */
  onDateRangeChange: (range: DateRange) => void
  /** Callback when date filter type changes */
  onDateFilterTypeChange: (type: 'order' | 'payment') => void
}

export default function OrderFilters({
  filter,
  paymentFilter,
  dateRange,
  dateFilterType,
  onFilterChange,
  onPaymentFilterChange,
  onDateRangeChange,
  onDateFilterTypeChange
}: OrderFiltersProps) {
  /**
   * Handle status filter change
   * Resets payment filter when changing to non-completed status
   */
  const handleStatusChange = (newFilter: string) => {
    onFilterChange(newFilter)
    if (newFilter !== 'completed') {
      onPaymentFilterChange('all')
    }
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Status Filter Buttons */}
      <div className="flex gap-4 flex-wrap">
        <FilterButton
          active={filter === 'all'}
          onClick={() => handleStatusChange('all')}
        >
          All Orders
        </FilterButton>
        <FilterButton
          active={filter === 'pending'}
          onClick={() => handleStatusChange('pending')}
        >
          Pending
        </FilterButton>
        <FilterButton
          active={filter === 'processing'}
          onClick={() => handleStatusChange('processing')}
        >
          Processing
        </FilterButton>
        <FilterButton
          active={filter === 'completed'}
          onClick={() => handleStatusChange('completed')}
        >
          Completed
        </FilterButton>
      </div>

      {/* Payment Status Filter (only visible for completed orders) */}
      {filter === 'completed' && (
        <div className="flex gap-4 items-center flex-wrap">
          <span className="text-light-gold font-traditional">Payment Status:</span>
          <FilterButton
            active={paymentFilter === 'all'}
            onClick={() => onPaymentFilterChange('all')}
          >
            All
          </FilterButton>
          <FilterButton
            active={paymentFilter === 'payment_completed'}
            onClick={() => onPaymentFilterChange('payment_completed')}
            variant="success"
          >
            ✅ Payment Completed
          </FilterButton>
          <FilterButton
            active={paymentFilter === 'payment_pending'}
            onClick={() => onPaymentFilterChange('payment_pending')}
            variant="warning"
          >
            ⏳ Payment Pending
          </FilterButton>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="flex gap-4 items-center flex-wrap">
        <span className="text-light-gold font-traditional">Date Range:</span>
        <FilterButton
          active={dateRange === 'all'}
          onClick={() => onDateRangeChange('all')}
        >
          All Time
        </FilterButton>
        <FilterButton
          active={dateRange === 'today'}
          onClick={() => onDateRangeChange('today')}
        >
          Today
        </FilterButton>
        <FilterButton
          active={dateRange === 'weeks'}
          onClick={() => onDateRangeChange('weeks')}
        >
          This Week (7 Days)
        </FilterButton>
        <FilterButton
          active={dateRange === 'months'}
          onClick={() => onDateRangeChange('months')}
        >
          This Month
        </FilterButton>
        <FilterButton
          active={dateRange === 'months3'}
          onClick={() => onDateRangeChange('months3')}
        >
          Last 3 Months
        </FilterButton>
      </div>

      {/* Date Filter Type Toggle - Separate row for better clarity */}
      {/* Only shows when a specific date range is selected (not "All Time") */}
      <div className="flex gap-4 items-center flex-wrap">
        <DateFilterTypeToggle
          dateFilterType={dateFilterType}
          onDateFilterTypeChange={onDateFilterTypeChange}
          dateRange={dateRange}
        />
      </div>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning'
}

/**
 * Individual filter button with active state styling
 */
function FilterButton({ active, onClick, children, variant = 'default' }: FilterButtonProps) {
  const getActiveClasses = () => {
    if (!active) return 'bg-traditional-brown text-cream'
    
    switch (variant) {
      case 'success':
        return 'bg-green-600 text-white'
      case 'warning':
        return 'bg-yellow-600 text-white'
      default:
        return 'bg-golden text-deep-brown'
    }
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-bold font-traditional ${getActiveClasses()}`}
    >
      {children}
    </button>
  )
}

