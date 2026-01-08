/**
 * ============================================================================
 * CUSTOMER FORM COMPONENT
 * ============================================================================
 * Form for collecting customer information during checkout.
 * Handles validation for phone, email, and required fields.
 * 
 * Features:
 * - Full name input
 * - Phone number with 10-digit validation
 * - Email with .com validation
 * - Pickup location selection
 * - Pickup date (required for biryani orders)
 */

'use client'

import { CustomerInfo } from '@/types'

interface CustomerFormProps {
  /** Current customer info values */
  customerInfo: CustomerInfo
  /** Whether the cart contains biryani (requires pickup date) */
  hasBiryani: boolean
  /** Callback when any field changes */
  onChange: (info: CustomerInfo) => void
}

/**
 * Validate email format (must end with .com)
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.toLowerCase().endsWith('.com')
}

export default function CustomerForm({
  customerInfo,
  hasBiryani,
  onChange
}: CustomerFormProps) {
  /**
   * Handle phone number input - only allow digits, max 10
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 10) {
      onChange({ ...customerInfo, phone: value })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Full Name */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional font-semibold">
          Full Name *
        </label>
        <input
          type="text"
          value={customerInfo.name}
          onChange={(e) => onChange({ ...customerInfo, name: e.target.value })}
          required
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional">
          Phone Number *
        </label>
        <input
          type="tel"
          value={customerInfo.phone}
          onChange={handlePhoneChange}
          required
          maxLength={10}
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
          placeholder="2095978565"
        />
        {customerInfo.phone && customerInfo.phone.length !== 10 && (
          <p className="text-red-400 text-sm mt-1">
            Phone number must be exactly 10 digits
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional">
          Email *
        </label>
        <input
          type="email"
          value={customerInfo.email}
          onChange={(e) => onChange({ ...customerInfo, email: e.target.value })}
          required
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
          placeholder="example@email.com"
        />
        {customerInfo.email && !validateEmail(customerInfo.email) && (
          <p className="text-red-400 text-sm mt-1">
            Email must be valid and end with .com
          </p>
        )}
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional font-semibold">
          Pickup Location *
        </label>
        <select
          value={customerInfo.location}
          onChange={(e) => onChange({ ...customerInfo, location: e.target.value })}
          required
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
        >
          <option value="">Select pickup location</option>
          <option value="Folsom">Folsom</option>
          <option value="Mountain House">Mountain House</option>
        </select>
      </div>

      {/* Pickup Date */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional font-semibold">
          Pickup Date {hasBiryani && <span className="text-red-400">* (Required for Biryani)</span>}
        </label>
        <input
          type="date"
          value={customerInfo.pickupDate}
          onChange={(e) => onChange({ ...customerInfo, pickupDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md"
          required={hasBiryani}
        />
        <p className="text-light-gold text-sm mt-1">
          {hasBiryani 
            ? 'Biryani orders require a pickup date' 
            : 'Optional: Select a preferred pickup date'}
        </p>
      </div>
    </div>
  )
}

