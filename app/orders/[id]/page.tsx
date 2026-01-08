'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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
}

interface Order {
  id: string
  totalAmount: number
  status: string
  whatsappSent: boolean
  createdAt: string
  items: OrderItem[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/signin')
      return
    }
    fetchOrder()
  }, [session, router, params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      const foundOrder = data.find((o: Order) => o.id === params.id)
      if (foundOrder) {
        setOrder(foundOrder)
      } else {
        toast.error('Order not found')
        router.push('/orders')
      }
    } catch (error) {
      toast.error('Failed to load order')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!order) return

    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to confirm order')
      }

      toast.success('Order confirmed! WhatsApp message sent to admin.')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400'
      case 'completed':
        return 'text-blue-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-golden text-2xl">Loading order...</div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen textured-bg p-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/orders')}
          className="mb-6 text-golden hover:text-light-gold font-traditional"
        >
          ← Back to Orders
        </button>

        <div className="traditional-border bg-deep-brown p-8 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-4xl golden-text font-traditional mb-2">
              Order Details
            </h1>
            <p className="text-light-gold">
              Order #{order.id.slice(0, 8)}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-traditional-brown p-4 rounded-lg">
              <h2 className="text-xl golden-text mb-3 font-traditional">Order Information</h2>
              <div className="space-y-2 text-cream">
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span className={getStatusColor(order.status)}>{order.status.toUpperCase()}</span></p>
                <p><strong>Total:</strong> <span className="text-golden font-bold">${order.totalAmount.toFixed(2)}</span></p>
              </div>
            </div>

            <div className="bg-traditional-brown p-4 rounded-lg">
              <h2 className="text-xl golden-text mb-3 font-traditional">Customer Information</h2>
              <div className="space-y-2 text-cream">
                <p><strong>Name:</strong> {order.customerName || 'N/A'}</p>
                <p><strong>Email:</strong> {order.customerEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-traditional-brown p-4 rounded-lg">
              <h2 className="text-xl golden-text mb-3 font-traditional">Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-deep-brown p-3 rounded-lg flex justify-between"
                  >
                    <div>
                      <p className="text-cream font-bold">{item.product.name}</p>
                      <p className="text-light-gold text-sm">
                        {item.quantity} x ${item.price} ({item.product.unit})
                      </p>
                    </div>
                    <p className="text-golden font-bold">
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'pending' && (
              <button
                onClick={handleConfirm}
                className="w-full bg-golden text-deep-brown py-4 rounded-lg font-bold text-xl hover:bg-light-gold transition-colors font-traditional"
              >
                Confirm Order & Send to WhatsApp
              </button>
            )}

            {order.whatsappSent && (
              <p className="text-green-400 text-center">
                ✓ WhatsApp message sent to admin
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

