/**
 * ============================================================================
 * LOADING SPINNER COMPONENT
 * ============================================================================
 * Reusable loading indicator used throughout the app.
 * Provides consistent loading states with optional customization.
 * 
 * Variants:
 * - fullscreen: Centers in viewport with branded messaging
 * - inline: Small spinner for inline loading states
 * - card: Medium spinner for card/section loading
 */

'use client'

type SpinnerVariant = 'fullscreen' | 'inline' | 'card'
type SpinnerSize = 'sm' | 'md' | 'lg'

interface LoadingSpinnerProps {
  /** Display variant */
  variant?: SpinnerVariant
  /** Spinner size */
  size?: SpinnerSize
  /** Optional loading message */
  message?: string
  /** Show branded header for fullscreen variant */
  showBranding?: boolean
}

/**
 * Get size classes based on size prop
 */
const getSizeClasses = (size: SpinnerSize): string => {
  const sizeMap: Record<SpinnerSize, string> = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }
  return sizeMap[size]
}

export default function LoadingSpinner({
  variant = 'fullscreen',
  size = 'md',
  message = 'Loading...',
  showBranding = true
}: LoadingSpinnerProps) {
  // Inline variant - just a simple spinner
  if (variant === 'inline') {
    return (
      <div
        className={`${getSizeClasses(size)} border-golden border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    )
  }

  // Card variant - spinner with optional message for card/section loading
  if (variant === 'card') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div
          className={`${getSizeClasses(size)} border-golden border-t-transparent rounded-full animate-spin mb-3`}
          role="status"
        />
        {message && (
          <p className="text-cream text-sm">{message}</p>
        )}
      </div>
    )
  }

  // Fullscreen variant - centered in viewport with optional branding
  return (
    <div className="min-h-screen textured-bg flex items-center justify-center">
      <div className="text-center">
        {/* Branded header */}
        {showBranding && (
          <>
            <div className="text-golden text-4xl font-traditional font-bold mb-4">
              SAI DATTA
            </div>
            <div className="w-16 h-1 bg-golden mx-auto mb-6" />
          </>
        )}
        
        {/* Spinner */}
        <div
          className="w-12 h-12 border-4 border-golden border-t-transparent rounded-full animate-spin mx-auto mb-4"
          role="status"
        />
        
        {/* Loading message */}
        <p className="text-cream text-xl">{message}</p>
      </div>
    </div>
  )
}

/**
 * Simple loading text component for basic loading states
 */
export function LoadingText({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-golden text-2xl">{message}</div>
    </div>
  )
}

