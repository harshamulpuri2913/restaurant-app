'use client'

/**
 * ============================================================================
 * PAYMENT DATE MODAL COMPONENT
 * ============================================================================
 * Modal to capture payment date/time (and optional notes) when marking
 * an order's payment as received. Designed to align with the existing
 * modal styling and interactions used across the admin UI.
 */

import { useEffect, useMemo, useState } from 'react'

interface PaymentDateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: { paymentDateISO: string; note?: string }) => void
  orderLabel: string
  totalAmount?: number
}

export default function PaymentDateModal({
  isOpen,
  onClose,
  onConfirm,
  orderLabel,
  totalAmount
}: PaymentDateModalProps) {
  const now = useMemo(() => new Date(), [])
  const toDateInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const toTimeInput = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const [date, setDate] = useState<string>(toDateInput(now))
  const [time, setTime] = useState<string>(toTimeInput(now))
  const [note, setNote] = useState<string>('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      const d = new Date()
      setDate(toDateInput(d))
      setTime(toTimeInput(d))
      setNote('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(onClose, 200)
  }

  const handleConfirm = () => {
    // Build ISO string from date + time inputs
    const [y, m, day] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const composed = new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0)
    const paymentDateISO = composed.toISOString()
    setIsAnimating(false)
    setTimeout(() => {
      onConfirm({ paymentDateISO, note: note.trim() || undefined })
      onClose()
    }, 200)
  }

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
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-700 bg-opacity-20 rounded-full mb-4 animate-pulse">
            <div className="text-6xl">💰</div>
          </div>
          <h2 className="text-3xl golden-text font-traditional font-bold mb-2">
            Mark Payment Received
          </h2>
          <div className="w-16 h-1 bg-golden mx-auto rounded-full"></div>
        </div>

        {/* Order Summary */}
        <div className="px-8">
          <div className="bg-traditional-brown rounded-xl p-4 border-2 border-golden border-opacity-30 mb-4">
            <p className="text-light-gold text-center font-bold text-lg break-words">
              {orderLabel}
            </p>
            {typeof totalAmount === 'number' && (
              <p className="text-cream text-center mt-1">
                Total: <span className="text-golden font-bold">${totalAmount.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="px-8 pb-4 space-y-3">
          <div>
            <label className="block text-light-gold text-sm font-semibold mb-2">
              📅 Payment Date & Time <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-traditional-brown border-2 border-golden border-opacity-50 rounded-xl text-cream focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden focus:ring-opacity-30"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-32 px-3 py-2 bg-traditional-brown border-2 border-golden border-opacity-50 rounded-xl text-cream focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden focus:ring-opacity-30"
              />
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  setDate(toDateInput(d))
                  setTime(toTimeInput(d))
                }}
                className="px-3 py-2 bg-golden text-deep-brown rounded-xl font-bold hover:bg-light-gold"
              >
                Use Now
              </button>
            </div>
          </div>

          <div>
            <label className="block text-light-gold text-sm font-semibold mb-2">
              📝 Notes (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Cash received, Zelle, Stripe settlement, etc."
              rows={3}
              className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden border-opacity-50 rounded-xl text-cream placeholder-gray-400 focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden focus:ring-opacity-30 resize-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 bg-traditional-brown text-cream py-4 rounded-xl font-bold hover:bg-opacity-80 transition-all duration-200 font-traditional border-2 border-golden transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <span className="text-lg">Cancel</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-br from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200 font-traditional shadow-xl transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">💰</span>
              <span className="text-lg">Mark Received</span>
            </div>
          </button>
        </div>

        <div className="h-2 bg-gradient-to-r from-golden via-light-gold to-golden rounded-b-2xl"></div>
      </div>
    </div>
  )
}


