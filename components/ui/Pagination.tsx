/**
 * ============================================================================
 * PAGINATION COMPONENT
 * ============================================================================
 * Reusable pagination controls for navigating through paginated data.
 * Used across orders list, admin dashboard, and other paginated views.
 * 
 * Features:
 * - Previous/Next navigation buttons
 * - Current page and total pages display
 * - Optional total items count display
 * - Disabled state handling for edge cases
 */

'use client'

interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Optional: Total number of items across all pages */
  totalItems?: number
  /** Optional: Label for items (e.g., "orders", "products") */
  itemLabel?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemLabel = 'items'
}: PaginationProps) {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null
  }

  /**
   * Navigate to previous page
   * Prevents going below page 1
   */
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  /**
   * Navigate to next page
   * Prevents going beyond last page
   */
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="flex justify-center items-center gap-4 mt-6 sm:mt-8">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="bg-golden text-deep-brown px-4 sm:px-6 py-2 rounded-lg font-bold hover:bg-light-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-traditional text-sm sm:text-base"
        aria-label="Go to previous page"
      >
        Previous
      </button>

      {/* Page Info */}
      <span className="text-cream text-sm sm:text-lg font-traditional">
        Page {currentPage} of {totalPages}
        {/* Show total items count if provided */}
        {totalItems !== undefined && (
          <span className="hidden sm:inline"> ({totalItems} total {itemLabel})</span>
        )}
      </span>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="bg-golden text-deep-brown px-4 sm:px-6 py-2 rounded-lg font-bold hover:bg-light-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-traditional text-sm sm:text-base"
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  )
}

