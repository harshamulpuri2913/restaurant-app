/**
 * ============================================================================
 * INVESTED ITEMS CATEGORIES API ROUTE
 * ============================================================================
 * API endpoint for managing invested item categories.
 * 
 * Categories provide hierarchical organization for invested items.
 * Supports nested categories (parent/child relationships).
 * 
 * Endpoints:
 * - GET /api/invested-items/categories - List all categories
 * - POST /api/invested-items/categories - Create a new category
 * 
 * Features:
 * - Hierarchical category structure (main categories + subcategories)
 * - Item count per category
 * - Alphabetical ordering
 * - Prisma model availability checking
 * 
 * Access Control:
 * - Admin only - Category management restricted to administrators
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkPrismaModels, formatErrorResponse, validateCategoryData } from '@/lib/invested-items-utils'

// =============================================================================
// GET - LIST CATEGORIES
// =============================================================================

/**
 * Retrieve all invested item categories
 * 
 * Returns only main categories (no parent) with their subcategories nested.
 * Includes item count for each category.
 * 
 * Response Structure:
 * ```json
 * [
 *   {
 *     "id": "abc123",
 *     "name": "Ingredients",
 *     "description": "Raw ingredients for cooking",
 *     "subCategories": [
 *       { "id": "def456", "name": "Flour" },
 *       { "id": "ghi789", "name": "Spices" }
 *     ],
 *     "_count": { "items": 15 }
 *   }
 * ]
 * ```
 * 
 * @returns Array of categories with subcategories and item counts
 */
export async function GET() {
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
    // FETCH CATEGORIES
    // -------------------------------------------------------------------------
    
    /**
     * Query only main categories (parentCategoryId is null)
     * Include nested subcategories, items for reference, and counts
     */
    const categories = await prisma.investedItemCategory.findMany({
      where: {
        parentCategoryId: null, // Only top-level categories
      },
      include: {
        subCategories: {
          orderBy: {
            name: 'asc', // Alphabetical ordering for subcategories
          },
        },
        items: {
          select: {
            id: true, // Only need IDs for reference
          },
        },
        _count: {
          select: {
            items: true, // Count of items in category
          },
        },
      },
      orderBy: {
        name: 'asc', // Alphabetical ordering for main categories
      },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to fetch categories')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// =============================================================================
// POST - CREATE CATEGORY
// =============================================================================

/**
 * Create a new category or subcategory
 * 
 * To create a main category, omit parentCategoryId.
 * To create a subcategory, provide the parent's ID.
 * 
 * Request Body:
 * ```json
 * {
 *   "name": "Spices",
 *   "description": "Various cooking spices",
 *   "parentCategoryId": "abc123"
 * }
 * ```
 * 
 * Required Fields:
 * - name: Category name
 * 
 * Optional Fields:
 * - description: Category description
 * - parentCategoryId: ID of parent category (for subcategories)
 * 
 * @param request - HTTP request with category data
 * @returns Created category with subcategories and item count
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
    const { name, description, parentCategoryId } = body

    // Validate required fields
    const validation = validateCategoryData({ name, description, parentCategoryId })
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // VERIFY PARENT CATEGORY EXISTS (IF PROVIDED)
    // -------------------------------------------------------------------------
    
    if (parentCategoryId) {
      const parentCategory = await prisma.investedItemCategory.findUnique({
        where: { id: parentCategoryId },
      })
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    // -------------------------------------------------------------------------
    // CREATE CATEGORY
    // -------------------------------------------------------------------------
    
    const category = await prisma.investedItemCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentCategoryId: parentCategoryId || null,
      },
      include: {
        subCategories: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to create category')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
