/**
 * ============================================================================
 * INVESTED ITEM BY ID API ROUTE
 * ============================================================================
 * API endpoint for managing individual invested items.
 * 
 * Endpoints:
 * - PATCH /api/invested-items/[id] - Update an invested item
 * - DELETE /api/invested-items/[id] - Delete an invested item
 * 
 * Features:
 * - Update item name, category, or custom fields
 * - Delete items from inventory
 * - Prisma model availability checking
 * - Category existence validation
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
// PATCH - UPDATE INVESTED ITEM
// =============================================================================

/**
 * Update an existing invested item
 * 
 * All fields are optional - only provided fields will be updated.
 * 
 * Request Body (all optional):
 * ```json
 * {
 *   "name": "Updated Item Name",
 *   "categoryId": "newCategoryId",
 *   "customFields": {
 *     "supplier": "New Supplier",
 *     "quantity": 100
 *   }
 * }
 * ```
 * 
 * @param request - HTTP request with update data
 * @param params - Route parameters containing item ID
 * @returns Updated item with category info
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
    const { name, categoryId, customFields } = body

    // -------------------------------------------------------------------------
    // VERIFY ITEM EXISTS
    // -------------------------------------------------------------------------
    
    const existingItem = await prisma.investedItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // VALIDATE INPUT
    // -------------------------------------------------------------------------
    
    /**
     * Only validate if name or categoryId is being updated
     */
    if (name !== undefined || categoryId !== undefined) {
      const validation = validateItemData({ name, categoryId })
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
    }

    // -------------------------------------------------------------------------
    // BUILD UPDATE DATA
    // -------------------------------------------------------------------------
    
    const updateData: any = {}
    
    // Update name if provided
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    
    // Update category if provided (verify it exists)
    if (categoryId !== undefined) {
      const category = await prisma.investedItemCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      updateData.categoryId = categoryId
    }
    
    // Update custom fields if provided
    if (customFields !== undefined) {
      // Validate custom fields is an object
      if (customFields !== null && typeof customFields !== 'object') {
        return NextResponse.json(
          { error: 'Custom fields must be an object' },
          { status: 400 }
        )
      }
      updateData.customFields = customFields
    }

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
    
    const item = await prisma.investedItem.update({
      where: { id: params.id },
      data: updateData,
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
    const errorResponse = formatErrorResponse(error, 'Failed to update invested item')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// =============================================================================
// DELETE - REMOVE INVESTED ITEM
// =============================================================================

/**
 * Delete an invested item
 * 
 * Permanently removes the item from the database.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing item ID
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
    // VERIFY ITEM EXISTS
    // -------------------------------------------------------------------------
    
    const existingItem = await prisma.investedItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // -------------------------------------------------------------------------
    // DELETE ITEM
    // -------------------------------------------------------------------------
    
    await prisma.investedItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Item deleted' })
  } catch (error: any) {
    const errorResponse = formatErrorResponse(error, 'Failed to delete invested item')
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
