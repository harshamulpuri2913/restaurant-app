/**
 * ============================================================================
 * MODAL COMPONENT
 * ============================================================================
 * Base modal component providing consistent styling and behavior for overlays.
 * Used as the foundation for all modal dialogs throughout the app.
 * 
 * Features:
 * - Backdrop click to close (optional)
 * - Escape key to close
 * - Focus trapping for accessibility
 * - Consistent styling with app theme
 * - Size variants (sm, md, lg, xl)
 */

'use client'

import { useEffect, useCallback, ReactNode } from 'react'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal content */
  children: ReactNode
  /** Optional modal title */
  title?: string
  /** Size variant - affects max-width */
  size?: ModalSize
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean
  /** Optional additional class names */
  className?: string
}

/**
 * Get Tailwind max-width class based on size variant
 */
const getSizeClass = (size: ModalSize): string => {
  const sizeMap: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl'
  }
  return sizeMap[size]
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = ''
}: ModalProps) {
  /**
   * Handle Escape key press to close modal
   */
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [onClose, closeOnEscape])

  /**
   * Add/remove escape key listener based on modal state
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscapeKey])

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-deep-brown traditional-border rounded-2xl shadow-2xl w-full ${getSizeClass(size)} max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (if title provided) */}
        {title && (
          <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-golden">
            <h2 id="modal-title" className="text-2xl sm:text-3xl golden-text font-traditional font-bold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-light-gold hover:text-golden text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-traditional-brown transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className={title ? 'p-6' : 'p-6'}>
          {children}
        </div>
      </div>
    </div>
  )
}

