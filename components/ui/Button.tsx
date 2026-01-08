/**
 * ============================================================================
 * BUTTON COMPONENT
 * ============================================================================
 * Reusable button component with consistent styling across the app.
 * Supports multiple variants, sizes, and states.
 * 
 * Variants:
 * - primary: Golden background, dark text (main CTAs)
 * - secondary: Brown background, cream text (secondary actions)
 * - success: Green background (confirmations)
 * - danger: Red background (destructive actions)
 * - warning: Yellow/amber background (caution actions)
 * - ghost: Transparent with border (subtle actions)
 */

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Button content */
  children: ReactNode
  /** Make button full width */
  fullWidth?: boolean
  /** Loading state */
  isLoading?: boolean
  /** Optional icon before text */
  icon?: ReactNode
}

/**
 * Get variant-specific classes
 */
const getVariantClasses = (variant: ButtonVariant): string => {
  const variantMap: Record<ButtonVariant, string> = {
    primary: 'bg-golden text-deep-brown hover:bg-light-gold shadow-md hover:shadow-lg transform hover:scale-105',
    secondary: 'bg-traditional-brown text-cream hover:bg-opacity-80',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-amber-600 text-white hover:bg-amber-700',
    ghost: 'bg-transparent border-2 border-golden text-golden hover:bg-golden hover:text-deep-brown'
  }
  return variantMap[variant]
}

/**
 * Get size-specific classes
 */
const getSizeClasses = (size: ButtonSize): string => {
  const sizeMap: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl'
  }
  return sizeMap[size]
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  isLoading = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-bold font-traditional transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2'
  const variantClasses = getVariantClasses(variant)
  const sizeClasses = getSizeClasses(size)
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      
      {/* Icon */}
      {!isLoading && icon && (
        <span>{icon}</span>
      )}
      
      {/* Button text */}
      {children}
    </button>
  )
}

/**
 * Icon-only button variant for toolbar actions
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'sm',
  className = '',
  ...props
}: Omit<ButtonProps, 'children'> & { icon: ReactNode }) {
  const baseClasses = 'font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center'
  const variantClasses = getVariantClasses(variant)
  
  // Size for icon buttons
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }[size]

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}

