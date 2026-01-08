/**
 * ============================================================================
 * HIGH AMOUNT MODAL COMPONENT
 * ============================================================================
 * Warning modal shown when order total exceeds $100.
 * Encourages customer to call for confirmation.
 * 
 * Features:
 * - Display order total
 * - Call button for phone contact
 * - Option to proceed anyway
 * - Cancel option
 */

'use client'

interface HighAmountModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Order total amount */
  total: number
  /** Callback to close modal */
  onClose: () => void
  /** Callback to proceed with order */
  onProceed: () => void
}

export default function HighAmountModal({
  isOpen,
  total,
  onClose,
  onProceed
}: HighAmountModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-deep-brown traditional-border p-6 rounded-lg max-w-md w-full">
        {/* Title */}
        <h2 className="text-2xl golden-text mb-4 font-traditional text-center">
          Order Amount Exceeds $100
        </h2>

        {/* Description */}
        <p className="text-cream mb-6 text-center">
          Your order total is ${total.toFixed(2)}. Please call us to confirm your order before proceeding.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Cancel */}
          <button
            onClick={onClose}
            className="flex-1 bg-traditional-brown text-cream py-3 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
          >
            Cancel
          </button>

          {/* Call Button */}
          <a
            href="tel:2095978565"
            className="flex-1 bg-golden text-deep-brown py-3 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional text-center"
          >
            📞 Call: 209-597-8565
          </a>

          {/* Proceed Anyway */}
          <button
            onClick={onProceed}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors font-traditional"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

