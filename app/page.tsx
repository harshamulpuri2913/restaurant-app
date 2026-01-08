'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect to menu page
    router.replace('/menu')
  }, [router])

  return (
    <div className="min-h-screen textured-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-golden text-4xl font-traditional font-bold mb-4">SAI DATTA</div>
        <div className="text-cream text-lg">Loading menu...</div>
      </div>
    </div>
  )
}

