/**
 * ============================================================================
 * PRODUCTS API ROUTE
 * ============================================================================
 * Main API endpoint for product management in the Restaurant App.
 * 
 * Endpoints:
 * - GET /api/products - List all available products
 * - POST /api/products - Create a new product (admin only)
 * 
 * Features:
 * - Role-based product visibility (admin sees hidden products)
 * - Support for size variants with different prices
 * - Category-based organization
 * - Pre-order only flag for special items
 * 
 * @requires Authentication for POST (admin only)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// =============================================================================
// GET - LIST PRODUCTS
// =============================================================================

/**
 * Retrieve all available products
 * 
 * Visibility Rules:
 * - Admin users: See all products (including hidden ones)
 * - Regular users: See only non-hidden, available products
 * 
 * Products are sorted by:
 * 1. Category (alphabetical)
 * 2. Name (alphabetical within category)
 * 
 * @param request - HTTP request
 * @returns Array of products
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'admin'

    /**
     * Build where clause based on user role
     * - Admin: All available products (including hidden)
     * - Others: Only visible, available products
     */
    const whereClause = isAdmin
      ? { isAvailable: true }
      : { isAvailable: true, isHidden: false }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },  // Group by category first
        { name: 'asc' },      // Then alphabetically by name
      ],
    })
    
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - CREATE PRODUCT
// =============================================================================

/**
 * Create a new product
 * 
 * Request Body:
 * ```json
 * {
 *   "name": "Product Name",
 *   "description": "Optional description",
 *   "category": "Snacks",
 *   "price": 9.99,
 *   "unit": "250gm",
 *   "preOrderOnly": false,
 *   "variants": {
 *     "250gm": 9.99,
 *     "500gm": 18.99,
 *     "1kg": 35.99
 *   }
 * }
 * ```
 * 
 * Required Fields:
 * - name: Product name
 * - category: Product category
 * - price: Base price
 * - unit: Base unit (e.g., "250gm", "1kg", "piece")
 * 
 * Optional Fields:
 * - description: Product description
 * - preOrderOnly: Whether product requires pre-order
 * - variants: Size variants with different prices
 * 
 * @param request - HTTP request with product data
 * @returns Created product
 */
export async function POST(request: Request) {
  try {
    // Admin authorization check
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { name, description, category, price, unit, preOrderOnly, variants } = body

    // Validate required fields
    if (!name || !category || price === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build product data
    const productData: any = {
      name,
      description: description || null,
      category,
      price: parseFloat(price),
      unit,
      preOrderOnly: preOrderOnly || false,
      isAvailable: true,  // New products are available by default
      isHidden: false,    // New products are visible by default
    }

    /**
     * Process variants (size options with prices)
     * Filter out invalid entries (empty, zero, or non-numeric values)
     * Example: { "250gm": 9.99, "500gm": 18.99 }
     */
    if (variants && typeof variants === 'object') {
      const validVariants: Record<string, number> = {}
      for (const [size, priceValue] of Object.entries(variants)) {
        if (priceValue && typeof priceValue === 'number' && priceValue > 0) {
          validVariants[size] = priceValue
        }
      }
      if (Object.keys(validVariants).length > 0) {
        productData.variants = validVariants
      }
    }

    // Create product in database
    const product = await prisma.product.create({
      data: productData,
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
