'use client'

/**
 * ============================================================================
 * DELETE/CANCEL/CONFIRM/REVERT CONFIRM MODAL COMPONENT
 * ============================================================================
 * Reusable modal for confirming critical actions with optional reason/note input.
 * 
 * Features:
 * - Animated modal with fade in/out transitions
 * - Displays item/order identifier
 * - Optional note/reason input field for admin use
 * - Customizable title, message, icon, and button text per variant
 * - Context-aware button colors (green for confirm, yellow for revert, red for delete/cancel)
 * - Cancel and Confirm buttons
 * 
 * Variants:
 * - 'delete': Item deletion confirmation (red theme, reason required)
 * - 'cancel': Order cancellation confirmation (red theme, reason required)
 * - 'confirm': Status confirmation (e.g., mark completed) (green theme, note optional)
 * - 'revert': Status reversion (e.g., revert to processing) (yellow theme, reason required)
 * 
 * Usage:
 * - Checkout page: Simple delete confirmation (variant="delete", no note)
 * - Admin dashboard - Delete item: Delete with reason (variant="delete", showNoteInput=true)
 * - Admin dashboard - Cancel order: Cancel with reason (variant="cancel", showNoteInput=true)
 * - Admin dashboard - Mark completed: Confirm completion (variant="confirm", showNoteInput=true, noteRequired=false)
 * - Admin dashboard - Revert status: Revert with reason (variant="revert", showNoteInput=true, noteRequired=true)
 */

import { useEffect, useState } from 'react'

interface DeleteConfirmModalProps {
  /** Whether modal is visible */
  isOpen: boolean
  /** Called when modal is closed (cancel or backdrop click) */
  onClose: () => void
  /** Called when action is confirmed */
  onConfirm: () => void
  /** Name of item being deleted/cancelled (displayed in modal) */
  itemName: string
  /** Custom message to display */
  message?: string
  /** Whether to show the note/reason input field */
  showNoteInput?: boolean
  /** Current note value (controlled) */
  noteValue?: string
  /** Called when note changes */
  onNoteChange?: (note: string) => void
  /** Placeholder text for note input */
  notePlaceholder?: string
  /** Whether note is required before action */
  noteRequired?: boolean
  /** Modal variant - 'delete' for deleting items, 'cancel' for cancelling orders, 'confirm' for confirmations, 'revert' for reverting status */
  variant?: 'delete' | 'cancel' | 'confirm' | 'revert'
  /** Custom title (overrides variant default) */
  title?: string
  /** Custom confirm button text (overrides variant default) */
  confirmText?: string
  /** Custom icon emoji (overrides variant default) */
  icon?: string
  /** Custom reason label (overrides variant default) */
  reasonLabel?: string
  /** Whether to show security code input field (for critical actions like delete all) */
  showCodeInput?: boolean
  /** Current code value (controlled) */
  codeValue?: string
  /** Called when code changes */
  onCodeChange?: (code: string) => void
  /** Placeholder text for code input */
  codePlaceholder?: string
  /** Security code label */
  codeLabel?: string
  /** Expected security code value (for validation) */
  expectedCode?: string
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  message = 'Are you sure you want to delete this item?',
  showNoteInput = false,
  noteValue = '',
  onNoteChange,
  notePlaceholder = 'Enter reason...',
  noteRequired = false,
  variant = 'delete',
  title,
  confirmText,
  icon,
  reasonLabel,
  showCodeInput = false,
  codeValue = '',
  onCodeChange,
  codePlaceholder = 'Enter security code...',
  codeLabel = 'Security Code',
  expectedCode,
}: DeleteConfirmModalProps) {
  /**
   * Determine display values based on variant
   * Market standard variants:
   * - 'delete': Item deletion confirmation
   * - 'cancel': Order cancellation with reason
   * - 'confirm': Status confirmation (e.g., mark completed)
   * - 'revert': Status reversion (e.g., revert to processing)
   */
  const getVariantDefaults = () => {
    switch (variant) {
      case 'cancel':
        return {
          title: 'Cancel Order',
          icon: '❌',
          confirmText: 'Cancel Order',
          reasonLabel: 'Reason for cancellation'
        }
      case 'confirm':
        return {
          title: 'Confirm Action',
          icon: '✓',
          confirmText: 'Confirm',
          reasonLabel: 'Notes (optional)'
        }
      case 'revert':
        return {
          title: 'Revert Order Status',
          icon: '↩️',
          confirmText: 'Revert to Processing',
          reasonLabel: 'Reason for reversion'
        }
      default: // 'delete'
        return {
          title: 'Delete Item',
          icon: '🗑️',
          confirmText: 'Delete',
          reasonLabel: 'Reason for deletion'
        }
    }
  }
  
  const variantDefaults = getVariantDefaults()
  const displayTitle = title || variantDefaults.title
  const displayIcon = icon || variantDefaults.icon
  const displayConfirmText = confirmText || variantDefaults.confirmText
  const displayReasonLabel = reasonLabel || variantDefaults.reasonLabel
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 200)
  }

  /**
   * Handle confirmation action
   * Validates required fields before proceeding:
   * - Note/reason (if required)
   * - Security code (if required and matches expected value)
   */
  const handleConfirm = () => {
    // Validate note/reason if required
    if (noteRequired && showNoteInput && !noteValue.trim()) {
      return
    }
    
    // Validate security code if required
    if (showCodeInput && expectedCode) {
      if (!codeValue.trim()) {
        return
      }
      if (codeValue.trim() !== expectedCode) {
        // Don't proceed - code mismatch (parent should handle error display)
        return
      }
    }
    
    setIsAnimating(false)
    setTimeout(() => {
      onConfirm()
      onClose()
    }, 200)
  }

  /**
   * Check if confirm button should be disabled
   * Disabled when:
   * - Note is required but empty
   * - Code is required but empty or incorrect
   * 
   * Returns boolean to satisfy TypeScript disabled prop type
   */
  const isConfirmDisabled: boolean = 
    Boolean(
      (noteRequired && showNoteInput && !noteValue.trim()) ||
      (showCodeInput && (!codeValue.trim() || (expectedCode && codeValue.trim() !== expectedCode)))
    )

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-deep-brown traditional-border rounded-2xl max-w-md w-full transform transition-all duration-300 shadow-2xl ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and Title Section */}
        <div className="text-center pt-8 pb-4 px-6">
          {/* Icon background color varies by variant for better visual context */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-pulse ${
            variant === 'confirm' 
              ? 'bg-green-600 bg-opacity-20' 
              : variant === 'revert'
              ? 'bg-yellow-600 bg-opacity-20'
              : 'bg-red-600 bg-opacity-20' // delete or cancel
          }`}>
            <div className="text-6xl">{displayIcon}</div>
          </div>
          <h2 className="text-3xl golden-text font-traditional font-bold mb-2">
            {displayTitle}
          </h2>
          <div className="w-16 h-1 bg-golden mx-auto rounded-full"></div>
        </div>

        {/* Message Section */}
        <div className="px-8 py-4">
          <p className="text-cream text-center text-lg mb-3">
            {message}
          </p>
          <div className="bg-traditional-brown rounded-xl p-4 border-2 border-golden border-opacity-30">
            <p className="text-light-gold text-center font-bold text-xl break-words">
              {itemName}
            </p>
          </div>
        </div>

        {/* Security Code Input Section (for critical actions like delete all) */}
        {showCodeInput && (
          <div className="px-8 pb-4">
            <label className="block text-light-gold text-sm font-semibold mb-2">
              🔒 {codeLabel} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={codeValue}
              onChange={(e) => onCodeChange?.(e.target.value)}
              placeholder={codePlaceholder}
              className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden border-opacity-50 rounded-xl text-cream placeholder-gray-400 focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden focus:ring-opacity-30 transition-all duration-200 font-mono text-center text-lg tracking-wider"
              autoComplete="off"
              spellCheck={false}
            />
            {codeValue.trim() && expectedCode && codeValue.trim() !== expectedCode && (
              <p className="text-red-400 text-xs mt-1 text-center">
                ❌ Invalid security code
              </p>
            )}
            {!codeValue.trim() && (
              <p className="text-yellow-400 text-xs mt-1 text-center">
                ⚠️ Security code required to proceed
              </p>
            )}
          </div>
        )}

        {/* Note/Reason Input Section (Optional) */}
        {showNoteInput && (
          <div className="px-8 pb-4">
            <label className="block text-light-gold text-sm font-semibold mb-2">
              📝 {displayReasonLabel} {noteRequired && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={noteValue}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder={notePlaceholder}
              rows={3}
              className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden border-opacity-50 rounded-xl text-cream placeholder-gray-400 focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden focus:ring-opacity-30 resize-none transition-all duration-200"
            />
            {noteRequired && !noteValue.trim() && (
              <p className="text-red-400 text-xs mt-1">
                Please provide a reason to proceed
              </p>
            )}
          </div>
        )}

        {/* Buttons Section */}
        <div className="flex gap-3 p-6 pt-4">
          <button
            onClick={handleClose}
            className="flex-1 bg-traditional-brown text-cream py-4 rounded-xl font-bold hover:bg-opacity-80 transition-all duration-200 font-traditional border-2 border-golden transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-lg">Cancel</span>
          </button>
          {/* Confirm button color varies by variant for better visual context */}
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`flex-1 py-4 rounded-xl font-bold transition-all duration-200 font-traditional shadow-xl transform ${
              isConfirmDisabled 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : variant === 'confirm'
                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 active:scale-95'
                : variant === 'revert'
                ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 hover:scale-105 active:scale-95'
                : 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:scale-105 active:scale-95' // delete or cancel
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{displayIcon}</span>
              <span className="text-lg">{displayConfirmText}</span>
            </div>
          </button>
        </div>

        {/* Bottom decorative line */}
        <div className="h-2 bg-gradient-to-r from-golden via-light-gold to-golden rounded-b-2xl"></div>
      </div>
    </div>
  )
}
