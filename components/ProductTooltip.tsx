'use client'

import { useState, useRef, useEffect } from 'react'

interface ProductTooltipProps {
  image?: string | null
  description?: string | null
  name: string
}

export default function ProductTooltip({ image, description, name }: ProductTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false)
    }, 200) // Small delay to prevent flickering
  }

  if (!image && !description) {
    return null
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="text-light-gold hover:text-golden cursor-help ml-2"
      >
        ℹ️
      </button>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-deep-brown border-2 border-golden rounded-lg p-4 shadow-xl min-w-[250px] max-w-[350px] left-0 top-full mt-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {image && (
            <div className="mb-3">
              <img
                src={image}
                alt={name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          {description && (
            <p className="text-cream text-sm font-traditional">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}

