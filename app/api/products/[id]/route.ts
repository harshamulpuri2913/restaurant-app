/**
 * ============================================================================
 * PRODUCT BY ID API ROUTE
 * ============================================================================
 * API endpoint for managing individual products.
 * 
 * Endpoints:
 * - PATCH /api/products/[id] - Update a product
 * - DELETE /api/products/[id] - Delete or hide a product
 * 
 * Features:
 * - Update product details (name, price, description, etc.)
 * - Manage size variants and their prices
 * - Set spending per variant for profit tracking
 * - Handle product visibility (hidden/visible)
 * - Soft delete for products with existing orders
 * - Image deletion when removing product image
 * 
 * Access Control:
 * - Admin only - Regular users cannot modify products
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// =============================================================================
// PATCH - UPDATE PRODUCT
// =============================================================================

/**
 * Update an existing product
 * 
 * All fields are optional - only provided fields will be updated.
 * 
 * Request Body (all optional):
 * ```json
 * {
 *   "name": "Updated Name",
 *   "price": 12.99,
 *   "description": "Updated description",
 *   "isHidden": false,
 *   "preOrderOnly": true,
 *   "spending": 5.50,
 *   "spendingVariants": { "250gm": 2.50, "500gm": 5.00 },
 *   "variants": { "250gm": 9.99, "500gm": 18.99 },
 *   "image": null  // Set to null to delete image
 * }
 * ```
 * 
 * @param request - HTTP request with update data
 * @param params - Route parameters containing product ID
 * @returns Updated product
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
    // PARSE REQUEST BODY
    // -------------------------------------------------------------------------
    
    const body = await request.json()
    const { 
      name, 
      price, 
      description, 
      isHidden, 
      preOrderOnly, 
      spending, 
      spendingVariants, 
      variants, 
      image 
    } = body

    // -------------------------------------------------------------------------
    // BUILD UPDATE DATA
    // -------------------------------------------------------------------------
    
    const updateData: any = {}
    
    // Simple field updates
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = parseFloat(price)
    if (description !== undefined) updateData.description = description
    if (isHidden !== undefined) updateData.isHidden = isHidden
    if (preOrderOnly !== undefined) updateData.preOrderOnly = preOrderOnly
    
    /**
     * Handle variants (size options with prices)
     * - null: Clear all variants
     * - object: Filter and save valid variants (size -> price)
     */
    if (variants !== undefined) {
      if (variants === null) {
        updateData.variants = null
      } else if (typeof variants === 'object' && variants !== null) {
        // Filter out invalid values, keep only valid numeric prices
        const validVariants: Record<string, number> = {}
        for (const [size, priceValue] of Object.entries(variants)) {
          const numPrice = typeof priceValue === 'string' 
            ? parseFloat(priceValue) 
            : Number(priceValue)
          if (!isNaN(numPrice) && numPrice > 0) {
            validVariants[size] = numPrice
          }
        }
        updateData.variants = Object.keys(validVariants).length > 0 
          ? validVariants 
          : null
      }
    }
    
    /**
     * Handle spending variants (cost per size for profit calculation)
     * Same logic as price variants but allows zero values
     */
    if (spendingVariants !== undefined) {
      if (spendingVariants === null) {
        updateData.spendingVariants = null
      } else if (typeof spendingVariants === 'object' && spendingVariants !== null) {
        const validSpendingVariants: Record<string, number> = {}
        for (const [size, spendingValue] of Object.entries(spendingVariants)) {
          const numSpending = typeof spendingValue === 'string' 
            ? parseFloat(spendingValue) 
            : Number(spendingValue)
          // Allow zero values for spending (free items)
          if (!isNaN(numSpending) && numSpending >= 0) {
            validSpendingVariants[size] = numSpending
          }
        }
        updateData.spendingVariants = Object.keys(validSpendingVariants).length > 0 
          ? validSpendingVariants 
          : null
      }
    }
    
    /**
     * Handle base spending (cost for non-variant products)
     * Used for profit calculation in earnings reports
     */
    if (spending !== undefined) {
      if (spending === null || spending === '' || spending === undefined) {
        updateData.spending = null
      } else {
        const spendingValue = typeof spending === 'string' 
          ? parseFloat(spending) 
          : Number(spending)
        if (!isNaN(spendingValue) && spendingValue >= 0) {
          updateData.spending = spendingValue
        } else {
          updateData.spending = null
        }
      }
    }
    
    /**
     * Handle image deletion
     * When image is set to null or empty string, delete the file
     */
    if (image !== undefined) {
      if (image === null || image === '') {
        // Get current product to find image path
        const currentProduct = await prisma.product.findUnique({
          where: { id: params.id },
          select: { image: true },
        })
        
        // Delete physical file if exists
        if (currentProduct?.image) {
          try {
            const imagePath = join(process.cwd(), 'public', currentProduct.image)
            if (existsSync(imagePath)) {
              await unlink(imagePath)
            }
          } catch (error) {
            // Silently handle image deletion errors (non-critical)
          }
        }
        updateData.image = null
      }
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
    
    try {
      const product = await prisma.product.update({
        where: { id: params.id },
        data: updateData,
      })

      return NextResponse.json(product)
    } catch (dbError: any) {
      /**
       * Handle Prisma schema errors
       * This can occur when schema is changed but client not regenerated
       */
      if (
        dbError?.code === 'P2002' || 
        dbError?.message?.includes('Unknown field') ||
        dbError?.message?.includes('Unknown argument')
      ) {
        return NextResponse.json(
          { 
            error: 'Prisma Client needs to be regenerated. Please restart the server after running: npm run db:generate',
            details: dbError?.message || 'The variants field may not be recognized by Prisma Client.'
          },
          { status: 500 }
        )
      }
      throw dbError
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to update product',
        details: error?.code || 'UNKNOWN_ERROR',
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - REMOVE OR HIDE PRODUCT
// =============================================================================

/**
 * Delete a product or hide it if it has orders
 * 
 * Behavior:
 * - If product has no orders: Permanently delete product and image
 * - If product has orders: Soft delete (hide + mark unavailable)
 * 
 * This protects order history integrity while allowing cleanup.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing product ID
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
    // CHECK FOR EXISTING ORDERS
    // -------------------------------------------------------------------------
    
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: params.id },
    })

    /**
     * If product has orders, soft delete instead of hard delete
     * This preserves order history and prevents data integrity issues
     */
    if (orderItemsCount > 0) {
      const product = await prisma.product.update({
        where: { id: params.id },
        data: {
          isHidden: true,
          isAvailable: false,
        },
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Product has orders. It has been hidden instead of deleted.',
        product 
      })
    }

    // -------------------------------------------------------------------------
    // GET PRODUCT FOR IMAGE CLEANUP
    // -------------------------------------------------------------------------
    
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { image: true },
    })

    // -------------------------------------------------------------------------
    // HARD DELETE PRODUCT
    // -------------------------------------------------------------------------
    
    await prisma.product.delete({
      where: { id: params.id },
    })

    // Delete associated image file if exists
    if (product?.image) {
      try {
        const imagePath = join(process.cwd(), 'public', product.image)
        if (existsSync(imagePath)) {
          await unlink(imagePath)
        }
      } catch (error) {
        // Silently handle image deletion errors (non-critical)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    })
  } catch (error: any) {
    /**
     * Handle foreign key constraint error
     * This is a fallback in case the count check missed something
     */
    if (error?.code === 'P2003' || error?.message?.includes('Foreign key constraint')) {
      try {
        const product = await prisma.product.update({
          where: { id: params.id },
          data: {
            isHidden: true,
            isAvailable: false,
          },
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Product has orders. It has been hidden instead of deleted.',
          product 
        })
      } catch (updateError) {
        return NextResponse.json(
          { error: 'Product cannot be deleted because it has orders. Please hide it instead.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to delete product', details: error?.code },
      { status: 500 }
    )
  }
}
