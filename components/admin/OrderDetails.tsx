'use client'

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

interface OrderDetailsProps {
  order: {
    id: string
    items: OrderItem[]
    totalAmount: number
    location?: string
    pickupDate?: string
    adminTimeline?: string
    adminNotes?: string
    paymentStatus: string
    status: string
    updatedAt?: string
    createdAt: string
  }
  editingPrices: boolean
  editingTotal: boolean
  itemPrices: Record<string, number>
  totalAmount: number
  onPriceChange: (itemId: string, price: number) => void
  onSavePrices: () => void
  onCancelEditPrices: () => void
  onTotalChange: (amount: number) => void
  onSaveTotal: () => void
  onCancelEditTotal: () => void
  onEditPrices: () => void
  onEditTotal: () => void
}

export default function OrderDetails({
  order,
  editingPrices,
  editingTotal,
  itemPrices,
  totalAmount,
  onPriceChange,
  onSavePrices,
  onCancelEditPrices,
  onTotalChange,
  onSaveTotal,
  onCancelEditTotal,
  onEditPrices,
  onEditTotal,
}: OrderDetailsProps) {
  const paymentDays = order.paymentStatus === 'payment_pending' && order.status === 'completed'
    ? Math.floor(
        (new Date().getTime() - new Date(order.updatedAt || order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="border-t-2 border-golden p-6 sm:p-8 bg-traditional-brown bg-opacity-30">
      {order.location && (
        <p className="text-light-gold text-sm mb-3">
          📍 Pickup Location: {order.location}
        </p>
      )}
      {order.adminTimeline && (
        <p className="text-golden text-sm mb-3">
          ⏰ Timeline: {order.adminTimeline}
        </p>
      )}
      {order.adminNotes && (
        <p className="text-cream text-sm mb-3 bg-traditional-brown p-2 rounded">
          📝 Notes: {order.adminNotes}
        </p>
      )}

      {order.paymentStatus === 'payment_pending' && order.status === 'completed' && paymentDays >= 7 && (
        <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border-2 border-red-700 rounded-lg">
          <p className="text-red-300 font-bold text-lg mb-2">
            ⚠️ Payment Pending for {paymentDays} days
          </p>
          <p className="text-red-200 text-base">
            📞 Please call: <a href="tel:2095978565" className="underline font-bold text-white">209-597-8565</a>
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xl golden-text font-traditional">Items:</h4>
        {!editingPrices && (
          <button
            onClick={onEditPrices}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700"
          >
            ✏️ Edit Prices
          </button>
        )}
      </div>
      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="bg-traditional-brown p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          >
            <div className="flex-1">
              <p className="text-cream font-bold">{item.product.name}</p>
              {editingPrices ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-light-gold text-sm">
                    {item.quantity} x
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrices[item.id] || item.price}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0
                      onPriceChange(item.id, newPrice)
                    }}
                    className="w-24 px-2 py-1 bg-deep-brown border border-golden rounded text-cream text-sm"
                  />
                  <span className="text-light-gold text-sm">
                    ({item.selectedSize || item.product.unit}) = ${((itemPrices[item.id] || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-light-gold text-sm">
                  {item.quantity} x ${item.price.toFixed(2)} ({item.selectedSize || item.product.unit})
                </p>
              )}
            </div>
            <p className="text-golden font-bold">
              ${editingPrices 
                ? ((itemPrices[item.id] || item.price) * item.quantity).toFixed(2)
                : item.subtotal.toFixed(2)}
            </p>
          </div>
        ))}
        {editingPrices && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSavePrices}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
            >
              Save Prices
            </button>
            <button
              onClick={onCancelEditPrices}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="border-t-2 border-golden pt-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-light-gold text-lg font-traditional">Total Amount:</span>
          {editingTotal ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => onTotalChange(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-2 bg-deep-brown border-2 border-golden rounded text-cream font-bold"
              />
              <button
                onClick={onSaveTotal}
                className="bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={onCancelEditTotal}
                className="bg-gray-600 text-white px-3 py-2 rounded font-bold hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-golden text-2xl font-bold">
                ${order.totalAmount.toFixed(2)}
              </span>
              <button
                onClick={onEditTotal}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700"
              >
                ✏️ Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

