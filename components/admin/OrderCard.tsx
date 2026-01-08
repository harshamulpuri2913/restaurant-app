'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  product: {
    name: string
    unit: string
  }
  quantity: number
  price: number
  subtotal: number
  selectedSize?: string | null
}

interface Order {
  id: string
  totalAmount: number
  status: string
  paymentStatus: string
  location?: string
  pickupDate?: string
  whatsappSent: boolean
  adminTimeline?: string
  adminNotes?: string
  paymentReceivedDate?: string | null
  createdAt: string
  updatedAt?: string
  items: OrderItem[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  user?: {
    name?: string
    email?: string
    phone?: string
  }
}

interface OrderCardProps {
  order: Order
  isExpanded: boolean
  onToggleExpand: () => void
  onConfirmOrder: () => void
  onUpdateStatus: (status: string, paymentStatus?: string) => void
  onEditDetails: () => void
  onEditPrices: () => void
  onEditTotal: () => void
  getStatusColor: (status: string) => string
}

export default function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  onConfirmOrder,
  onUpdateStatus,
  onEditDetails,
  onEditPrices,
  onEditTotal,
  getStatusColor,
}: OrderCardProps) {
  const paymentDays = order.paymentStatus === 'payment_pending' && order.status === 'completed'
    ? Math.floor(
        (new Date().getTime() - new Date(order.updatedAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  let borderColor = 'border-golden'
  let bgColor = 'bg-deep-brown'

  if (order.paymentStatus === 'payment_completed') {
    borderColor = 'border-green-500'
    bgColor = 'bg-deep-brown'
  } else if (order.paymentStatus === 'payment_pending' && order.status === 'completed') {
    if (paymentDays >= 7) {
      borderColor = 'border-red-700'
      bgColor = 'bg-red-950 bg-opacity-30'
    } else {
      borderColor = 'border-yellow-500'
      bgColor = 'bg-yellow-950 bg-opacity-20'
    }
  }

  return (
    <div
      className={`traditional-border ${borderColor} ${bgColor} rounded-xl overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 space-y-2 w-full">
            <div className="flex items-center gap-4 flex-wrap">
              <h3 className="text-xl sm:text-2xl golden-text font-traditional font-bold">
                Order #{order.id.slice(0, 8)}
              </h3>
              <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getStatusColor(order.status)} bg-opacity-20`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-light-gold font-semibold">Order Created:</p>
                <p className="text-cream">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-light-gold font-semibold">Last Updated:</p>
                <p className="text-cream">{new Date(order.updatedAt || order.createdAt).toLocaleString()}</p>
              </div>
              {order.paymentReceivedDate && (
                <div>
                  <p className="text-light-gold font-semibold">💰 Payment Received:</p>
                  <p className="text-green-400 font-bold">{new Date(order.paymentReceivedDate).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {(() => {
                let paymentColor = 'text-green-400'
                let paymentText = '✅ Payment Completed'

                if (order.paymentStatus === 'payment_pending') {
                  if (order.status === 'completed') {
                    if (paymentDays >= 5) {
                      paymentColor = 'text-red-700'
                      paymentText = `⏳ Payment Pending (${paymentDays} days)`
                    } else {
                      paymentColor = 'text-red-400'
                      paymentText = `⏳ Payment Pending (${paymentDays} days)`
                    }
                  } else {
                    paymentColor = 'text-yellow-400'
                    paymentText = '⏳ Payment Pending'
                  }
                }

                return (
                  <p className={`text-base font-bold ${paymentColor}`}>
                    {paymentText}
                  </p>
                )
              })()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p className="text-cream">
                  <span className="text-light-gold font-semibold">👤 Customer:</span> {order.customerName || order.user?.name || 'N/A'}
                </p>
                <p className="text-cream">
                  <span className="text-light-gold font-semibold">📞 Phone:</span> {order.customerPhone || order.user?.phone || 'N/A'}
                </p>
                {order.location && (
                  <p className="text-light-gold">
                    <span className="font-semibold">📍 Location:</span> {order.location}
                  </p>
                )}
                {order.pickupDate && (
                  <p className="text-golden">
                    <span className="font-semibold">📅 Pickup Date:</span> {new Date(order.pickupDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {order.status === 'pending' && (() => {
              const daysPending = Math.floor(
                (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              )
              if (daysPending >= 1) {
                return (
                  <p className="text-red-400 text-xs mt-1">
                    ⚠️ Pending {daysPending} day(s) - Call customer
                  </p>
                )
              }
              return null
            })()}
          </div>
          <div className="text-right ml-4 flex flex-col items-end">
            <p className="text-2xl sm:text-3xl golden-text font-bold mb-2">
              ${order.totalAmount.toFixed(2)}
            </p>
            <p className="text-light-gold text-sm">
              {isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
            </p>
          </div>
        </div>
      </div>
      {/* Expanded content will be handled by parent component */}
    </div>
  )
}

