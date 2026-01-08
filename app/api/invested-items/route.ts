/**
 * ============================================================================
 * INVESTED ITEMS API ROUTE
 * ============================================================================
 * Main API endpoint for managing invested items (inventory/supplies tracking).
 * 
 * Invested Items represent inventory that the restaurant has purchased or
 * invested in, such as ingredients, packaging materials, equipment, etc.
 * 
 * Endpoints:
 * - GET /api/invested-items - List all invested items
 * - POST /api/invested-items - Create a new invested item
 * 
 * Features:
 * - CRUD operations for inventory items
 * - Category-based organization
 * - Custom fields support (flexible JSON storage)
 * - Prisma model availability checking
 * - Standardized error responses
 * 
 * Access Control:
 * - Admin only - Inventory management restricted to administrators
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkPrismaModels, formatErrorResponse, validateItemData } from '@/lib/invested-items-utils'

// =============================================================================
// GET - LIST INVESTED ITEMS
// =============================================================================

/**
 * Retrieve all invested items
 * 
 * Optionally filter by category using query parameter.
 * 
 * Query Parameters:
 * - categoryId: Filter items by category (optional)
 * 
 * Response includes:
 * - Item details (name, custom fields)
 * - Category with parent category info
 * 
 * @example GET /api/invested-items
 * @example GET /api/invested-items?categoryId=abc123
 * 
 * @param request - HTTP request with optional query parameters
 * @returns Array of invested items
 */
export async function GET(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // CHECK DATABASE MODEL AVAILABILITY
    // -------------------------------------------------------------------------
    
    /**
     * Verify Prisma models exist before querying
     * This helps catch schema sync issues early
     */
    const modelCheck = checkPrismaModels()
    if (!modelCheck.available) {
      return NextResponse.json(
        {
          error: 'Database models not available',
          details: `Missing models: ${modelCheck.missing.join(', ')}`,
          solution: modelCheck.solution,
        },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // PARSE QUERY PARAMETERS
    // -------------------------------------------------------------------------
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    // Build filter condition
    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }

    // -------------------------------------------------------------------------
    // FETCH INVESTED ITEMS
    // -------------------------------------------------------------------------
    
    const items = await prisma.investedItem.findMany({
      where,
      include: {
        category: {
          include: {
            parentCategory: true, // Include parent for nested categories
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Newest first
      },
    })

    return NextResponse.json(items)
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to fetch invested items')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// =============================================================================
// POST - CREATE INVESTED ITEM
// =============================================================================

/**
 * Create a new invested item
 * 
 * Items must belong to a category. Custom fields allow flexible
 * additional data storage (e.g., supplier info, purchase date, quantity).
 * 
 * Request Body:
 * ```json
 * {
 *   "name": "All Purpose Flour",
 *   "categoryId": "abc123",
 *   "customFields": {
 *     "supplier": "ABC Supplies",
 *     "purchaseDate": "2024-01-15",
 *     "quantity": 50,
 *     "unit": "kg"
 *   }
 * }
 * ```
 * 
 * Required Fields:
 * - name: Item name
 * - categoryId: Category ID (must exist)
 * 
 * Optional Fields:
 * - customFields: JSON object with flexible additional data
 * 
 * @param request - HTTP request with item data
 * @returns Created item with category info
 */
export async function POST(request: Request) {
  try {
    // -------------------------------------------------------------------------
    // ADMIN AUTHORIZATION CHECK
    // -------------------------------------------------------------------------
    
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // -------------------------------------------------------------------------
    // CHECK DATABASE MODEL AVAILABILITY
    // -------------------------------------------------------------------------
    
    const modelCheck = checkPrismaModels()
    if (!modelCheck.available) {
      return NextResponse.json(
        {
          error: 'Database models not available',
          details: `Missing models: ${modelCheck.missing.join(', ')}`,
          solution: modelCheck.solution,
        },
        { status: 500 }
      )
    }

    // -------------------------------------------------------------------------
    // PARSE AND VALIDATE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { name, categoryId, customFields } = body

    // Validate required fields
    const validation = validateItemData({ name, categoryId })
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // VERIFY CATEGORY EXISTS
    // -------------------------------------------------------------------------
    
    const category = await prisma.investedItemCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // VALIDATE CUSTOM FIELDS
    // -------------------------------------------------------------------------
    
    /**
     * Custom fields must be an object or null
     * This allows flexible additional data storage
     */
    if (customFields !== undefined && customFields !== null && typeof customFields !== 'object') {
      return NextResponse.json(
        { error: 'Custom fields must be an object' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // CREATE INVESTED ITEM
    // -------------------------------------------------------------------------
    
    const item = await prisma.investedItem.create({
      data: {
        name: name.trim(),
        categoryId,
        customFields: customFields || null,
      },
      include: {
        category: {
          include: {
            parentCategory: true,
          },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to create invested item')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
