/**
 * ============================================================================
 * ORDER TOTAL EDITOR COMPONENT
 * ============================================================================
 * Allows admin to view and edit the total amount of an order.
 * Useful for applying discounts or adjustments.
 * 
 * Features:
 * - Display current total
 * - Edit mode with input field
 * - Save/cancel actions
 */

'use client'

interface OrderTotalEditorProps {
  /** Current total amount */
  totalAmount: number
  /** Whether editing is active */
  isEditing: boolean
  /** Current edited total value */
  editedTotal: number
  /** Callback when edit button is clicked */
  onEditClick: () => void
  /** Callback when total value changes */
  onTotalChange: (value: number) => void
  /** Callback when save is clicked */
  onSave: () => void
  /** Callback when cancel is clicked */
  onCancel: () => void
}

export default function OrderTotalEditor({
  totalAmount,
  isEditing,
  editedTotal,
  onEditClick,
  onTotalChange,
  onSave,
  onCancel
}: OrderTotalEditorProps) {
  return (
    <div className="border-t-2 border-golden pt-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-light-gold text-lg font-traditional">Total Amount:</span>
        
        {isEditing ? (
          /* Edit Mode */
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={editedTotal}
              onChange={(e) => onTotalChange(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-2 bg-deep-brown border-2 border-golden rounded text-cream font-bold"
            />
            <button
              onClick={onSave}
              className="bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-3 py-2 rounded font-bold hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* View Mode */
          <div className="flex items-center gap-2">
            <span className="text-golden text-2xl font-bold">
              ${totalAmount.toFixed(2)}
            </span>
            <button
              onClick={onEditClick}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700"
            >
              ✏️ Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

