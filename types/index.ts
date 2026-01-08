/**
 * ============================================================================
 * SHARED TYPE DEFINITIONS
 * ============================================================================
 * Central type definitions used across the Restaurant App.
 * These types ensure type safety and consistency throughout the codebase.
 */

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Product - Represents a menu item in the restaurant
 * @property id - Unique identifier for the product
 * @property name - Display name of the product
 * @property category - Category for grouping (snacks, sweets, biryani, etc.)
 * @property price - Base price of the product
 * @property unit - Unit of measurement (e.g., "250gm", "piece")
 * @property isAvailable - Whether the product is currently available for ordering
 * @property preOrderOnly - If true, product requires advance ordering
 * @property image - Optional URL to product image
 * @property description - Optional product description
 * @property variants - Optional price variants (e.g., { "250gm": 5.00, "500gm": 9.00 })
 */
export interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
  isAvailable: boolean
  preOrderOnly?: boolean
  image?: string | null
  description?: string | null
  variants?: Record<string, number> | null
}

// =============================================================================
// CART TYPES
// =============================================================================

/**
 * CartItem - Represents an item in the shopping cart
 * @property productId - Reference to the product ID
 * @property product - Full product data
 * @property quantity - Number of units in cart
 * @property selectedSize - Selected variant/size (e.g., "500gm")
 * @property specialInstructions - Optional customer notes for this item
 */
export interface CartItem {
  productId: string
  product: Product
  quantity: number
  selectedSize?: string | null
  specialInstructions?: string
}

/**
 * CartItemBasic - Simplified cart item for checkout display
 */
export interface CartItemBasic {
  productId: string
  product: {
    id: string
    name: string
    price: number
    unit: string
    category?: string
    variants?: Record<string, number> | null
  }
  quantity: number
  selectedSize?: string | null
  specialInstructions?: string
}

// =============================================================================
// ORDER TYPES
// =============================================================================

/**
 * OrderItem - Represents an item within an order
 * @property id - Unique identifier for the order item
 * @property product - Product information at time of order
 * @property quantity - Number of units ordered
 * @property price - Price per unit at time of order
 * @property subtotal - Total for this item (price * quantity)
 * @property selectedSize - Selected variant/size
 * @property specialInstructions - Customer notes for this item
 */
export interface OrderItem {
  id: string
  product: {
    name: string
    unit: string
  }
  quantity: number
  price: number
  subtotal: number
  selectedSize?: string | null
  specialInstructions?: string | null
}

/**
 * Order - Represents a customer order
 * Contains all order details including customer info, items, and status
 */
export interface Order {
  id: string
  totalAmount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
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

/**
 * OrderStatus - Possible states for an order
 */
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

/**
 * PaymentStatus - Possible payment states
 */
export type PaymentStatus = 'payment_pending' | 'payment_completed'

// =============================================================================
// CUSTOMER TYPES
// =============================================================================

/**
 * CustomerInfo - Customer details for checkout
 */
export interface CustomerInfo {
  name: string
  phone: string
  email: string
  location: string
  pickupDate: string
}

// =============================================================================
// FILTER TYPES
// =============================================================================

/**
 * OrderFilters - Filter options for order lists
 */
export interface OrderFilters {
  status: string
  paymentStatus: string
  dateRange: DateRange
}

/**
 * DateRange - Predefined date ranges for filtering
 */
export type DateRange = 'all' | 'today' | 'weeks' | 'months' | 'months3'

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * DeleteItemPayload - Data needed to delete an order item
 */
export interface DeleteItemPayload {
  orderId: string
  itemId: string
  itemName: string
}

/**
 * ItemPrices - Map of item IDs to their prices (for editing)
 */
export type ItemPrices = Record<string, number>

/**
 * SelectedVariants - Map of product IDs to selected variant keys
 */
export type SelectedVariants = Record<string, string>

/**
 * Quantities - Map of quantity keys to quantity values
 */
export type Quantities = Record<string, number>

