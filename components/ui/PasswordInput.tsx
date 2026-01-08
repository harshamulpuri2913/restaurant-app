/**
 * ============================================================================
 * PASSWORD INPUT COMPONENT
 * ============================================================================
 * Reusable password input field with show/hide toggle functionality.
 * 
 * Features:
 * - Password visibility toggle (eye icon)
 * - Market-standard UI (👁️ / 👁️‍🗨️ icons)
 * - Accessible for screen readers
 * - Consistent styling with app theme
 * - Type safety with TypeScript
 * 
 * Usage:
 * <PasswordInput
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   placeholder="Enter your password"
 *   required
 * />
 * 
 * @component
 */

'use client'

import { useState } from 'react'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for PasswordInput component
 */
interface PasswordInputProps {
  /** Current password value */
  value: string
  /** Change handler for password input */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Input field placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Input field ID */
  id?: string
  /** Input field name */
  name?: string
  /** Additional CSS classes */
  className?: string
  /** Minimum password length */
  minLength?: number
  /** Whether input is disabled */
  disabled?: boolean
  /** Validation error message to display */
  error?: string
  /** Label text for the input */
  label?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PasswordInput Component
 * 
 * Renders a password input field with show/hide toggle functionality.
 * Uses eye icons (👁️ / 👁️‍🗨️) for visibility toggle, following market standards.
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter your password',
  required = false,
  id,
  name = 'password',
  className = '',
  minLength,
  disabled = false,
  error,
  label,
}: PasswordInputProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  /**
   * Toggle between showing and hiding password
   * Default: hidden (false)
   */
  const [showPassword, setShowPassword] = useState(false)

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * Toggle password visibility
   * Switches between 'password' and 'text' input types
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  return (
    <div>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-light-gold mb-2 font-traditional text-sm"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Password Input Field */}
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-12
            bg-traditional-brown border-2 border-golden rounded-lg
            text-cream
            focus:outline-none focus:ring-2 focus:ring-golden
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-label={label || placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        {/* Show/Hide Password Toggle Button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-golden hover:text-light-gold
            focus:outline-none focus:ring-2 focus:ring-golden rounded
            p-1
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {/* Eye Icon - Show Password */}
          {showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            // Eye Icon - Hide Password
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="text-red-400 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

