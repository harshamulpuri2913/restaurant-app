/**
 * ============================================================================
 * INVESTED ITEMS CATEGORY BY ID API ROUTE
 * ============================================================================
 * API endpoint for managing individual invested item categories.
 * 
 * Endpoints:
 * - PATCH /api/invested-items/categories/[id] - Update a category
 * - DELETE /api/invested-items/categories/[id] - Delete a category
 * 
 * Features:
 * - Update category name, description, or parent
 * - Delete categories (with validation for items/subcategories)
 * - Circular reference prevention
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
// PATCH - UPDATE CATEGORY
// =============================================================================

/**
 * Update an existing category
 * 
 * All fields are optional - only provided fields will be updated.
 * Includes validation to prevent circular parent references.
 * 
 * Request Body (all optional):
 * ```json
 * {
 *   "name": "Updated Category Name",
 *   "description": "Updated description",
 *   "parentCategoryId": "newParentId"
 * }
 * ```
 * 
 * Validation:
 * - Category cannot be its own parent
 * - Parent category must exist if specified
 * 
 * @param request - HTTP request with update data
 * @param params - Route parameters containing category ID
 * @returns Updated category with subcategories and item count
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    // PARSE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { name, description, parentCategoryId } = body

    // -------------------------------------------------------------------------
    // VALIDATE NAME IF PROVIDED
    // -------------------------------------------------------------------------
    
    if (name !== undefined) {
      const validation = validateCategoryData({ name })
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
    }

    // -------------------------------------------------------------------------
    // VERIFY CATEGORY EXISTS
    // -------------------------------------------------------------------------
    
    const existingCategory = await prisma.investedItemCategory.findUnique({
      where: { id: params.id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // VALIDATE PARENT CATEGORY
    // -------------------------------------------------------------------------
    
    if (parentCategoryId !== undefined) {
      /**
       * Prevent circular reference:
       * A category cannot be its own parent
       */
      if (parentCategoryId === params.id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }
      
      // Verify parent category exists if a value is provided
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
    }

    // -------------------------------------------------------------------------
    // BUILD UPDATE DATA
    // -------------------------------------------------------------------------
    
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (parentCategoryId !== undefined) updateData.parentCategoryId = parentCategoryId || null

    // -------------------------------------------------------------------------
    // VALIDATE UPDATE DATA EXISTS
    // -------------------------------------------------------------------------
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // PERFORM UPDATE
    // -------------------------------------------------------------------------
    
    const category = await prisma.investedItemCategory.update({
      where: { id: params.id },
      data: updateData,
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
    const errorResponse = formatErrorResponse(error, 'Failed to update category')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// =============================================================================
// DELETE - REMOVE CATEGORY
// =============================================================================

/**
 * Delete a category
 * 
 * Categories can only be deleted if they have:
 * - No items assigned to them
 * - No subcategories
 * 
 * This prevents orphaned items and maintains data integrity.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing category ID
 * @returns Success message
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    // FETCH CATEGORY WITH RELATED DATA
    // -------------------------------------------------------------------------
    
    const category = await prisma.investedItemCategory.findUnique({
      where: { id: params.id },
      include: {
        items: true,           // Check for assigned items
        subCategories: true,   // Check for child categories
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // -------------------------------------------------------------------------
    // VALIDATE DELETION IS SAFE
    // -------------------------------------------------------------------------
    
    /**
     * Cannot delete category with items
     * User must delete or reassign items first
     */
    if (category.items.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with items. Please delete items first.' },
        { status: 400 }
      )
    }

    /**
     * Cannot delete category with subcategories
     * User must delete subcategories first
     */
    if (category.subCategories.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // DELETE CATEGORY
    // -------------------------------------------------------------------------
    
    await prisma.investedItemCategory.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to delete category')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
