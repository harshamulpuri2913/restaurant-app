/**
 * ============================================================================
 * ADMIN HEADER COMPONENT
 * ============================================================================
 * Header section for admin dashboard with navigation and action buttons.
 * Provides quick access to all admin functions.
 * 
 * Features:
 * - Navigation to products, inventory, earnings
 * - Export orders functionality
 * - Delete all orders (with confirmation)
 * - Return to menu
 */

'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface AdminHeaderProps {
  /** Callback to export orders to Excel */
  onExport: () => void
  /** Callback to delete all orders */
  onDeleteAll: () => void
}

export default function AdminHeader({ onExport, onDeleteAll }: AdminHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex justify-between items-center mb-6">
      {/* Page Title */}
      <h1 className="text-4xl golden-text font-traditional">
        Admin Dashboard
      </h1>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {/* Manage Products */}
        <button
          onClick={() => router.push('/admin/products')}
          className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
        >
          Manage Products
        </button>

        {/* Inventory */}
        <button
          onClick={() => router.push('/admin/invested-items')}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors font-traditional"
        >
          Inventory
        </button>

        {/* Earnings & Spending */}
        <button
          onClick={() => router.push('/admin/earnings')}
          className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
        >
          Earnings & Spending
        </button>

        {/* Export to Excel */}
        <button
          onClick={onExport}
          className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
        >
          Export to Excel
        </button>

        {/* Delete All Orders */}
        <button
          onClick={onDeleteAll}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors font-traditional"
        >
          🗑️ Delete All Orders
        </button>

        {/* Back to Menu */}
        <button
          onClick={() => router.push('/menu')}
          className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
        >
          Back to Menu
        </button>
      </div>
    </div>
  )
}

