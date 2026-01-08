/**
 * ============================================================================
 * DATE FILTER TYPE TOGGLE COMPONENT
 * ============================================================================
 * Reusable component for toggling between Order Date and Payment Date filtering.
 * 
 * Features:
 * - Toggle between "Order Date" and "Payment Date" filtering
 * - Only visible when a date range is selected (not "All Time")
 * - Matches styling of OrderFilters component
 * 
 * Usage:
 * - Admin orders page - Filter orders by creation or payment date
 * - Earnings page - Filter earnings by order or payment date
 */

'use client'

interface DateFilterTypeToggleProps {
  /** Current date filter type - 'order' or 'payment' */
  dateFilterType: 'order' | 'payment'
  /** Callback when date filter type changes */
  onDateFilterTypeChange: (type: 'order' | 'payment') => void
  /** Current date range - toggle only shows when not 'all' */
  dateRange: string
}

/**
 * Date filter type toggle component
 * Allows admin to choose between filtering by order creation date or payment received date
 */
export default function DateFilterTypeToggle({
  dateFilterType,
  onDateFilterTypeChange,
  dateRange
}: DateFilterTypeToggleProps) {
  // Only show toggle when a specific date range is selected (not "All Time")
  if (dateRange === 'all') {
    return null
  }

  return (
    <>
      {/* Label for clarity - explains what this toggle does */}
      <span className="text-light-gold font-traditional font-semibold">Filter by Date Type:</span>
      <FilterButton
        active={dateFilterType === 'order'}
        onClick={() => onDateFilterTypeChange('order')}
      >
        📅 Order Date
      </FilterButton>
      <FilterButton
        active={dateFilterType === 'payment'}
        onClick={() => onDateFilterTypeChange('payment')}
      >
        💰 Payment Date
      </FilterButton>
    </>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

/**
 * Filter button with active state styling
 * Matches the styling from OrderFilters component for consistency
 */
function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-bold font-traditional ${
        active
          ? 'bg-golden text-deep-brown'
          : 'bg-traditional-brown text-cream'
      }`}
    >
      {children}
    </button>
  )
}

