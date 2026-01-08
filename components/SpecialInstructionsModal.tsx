'use client'

import { useState, useEffect } from 'react'

interface SpecialInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (instructions: string) => void
  productName: string
  currentInstructions?: string
}

export default function SpecialInstructionsModal({
  isOpen,
  onClose,
  onSave,
  productName,
  currentInstructions = '',
}: SpecialInstructionsModalProps) {
  const [instructions, setInstructions] = useState(currentInstructions)

  useEffect(() => {
    setInstructions(currentInstructions)
  }, [currentInstructions, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(instructions.trim())
    onClose()
  }

  const handleClear = () => {
    setInstructions('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-deep-brown traditional-border p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl golden-text mb-4 font-traditional text-center">
          Special Instructions
        </h2>
        <p className="text-light-gold mb-4 text-center">
          {productName}
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Extra spicy, No onions, Less oil..."
          className="w-full px-4 py-3 bg-traditional-brown border-2 border-golden rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-golden shadow-md min-h-[120px] resize-vertical"
          maxLength={200}
        />
        <p className="text-sm text-light-gold mt-2 text-right">
          {instructions.length}/200 characters
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-traditional-brown text-cream py-3 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional border border-golden"
          >
            Cancel
          </button>
          {instructions.trim() && (
            <button
              onClick={handleClear}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors font-traditional"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 bg-golden text-deep-brown py-3 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
          >
            {instructions.trim() ? 'Save' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}
