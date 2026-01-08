/**
 * ============================================================================
 * PRODUCT IMAGE UPLOAD API ROUTE
 * ============================================================================
 * API endpoint for uploading product images.
 * 
 * Endpoints:
 * - POST /api/products/[id]/image - Upload image for a product
 * 
 * Features:
 * - File upload via FormData
 * - Automatic directory creation
 * - Unique filename generation
 * - Database record update with image path
 * 
 * File Storage:
 * - Location: /public/uploads/products/
 * - Format: [productId]-[timestamp].[extension]
 * - Accessible via: /uploads/products/[filename]
 * 
 * Access Control:
 * - Admin only - Regular users cannot upload images
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// =============================================================================
// POST - UPLOAD PRODUCT IMAGE
// =============================================================================

/**
 * Upload an image for a product
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'image' field containing the file
 * 
 * Workflow:
 * 1. Validate admin authentication
 * 2. Extract file from FormData
 * 3. Create uploads directory if needed
 * 4. Generate unique filename
 * 5. Save file to disk
 * 6. Update product record with image URL
 * 
 * @example
 * const formData = new FormData()
 * formData.append('image', file)
 * fetch('/api/products/123/image', { method: 'POST', body: formData })
 * 
 * @param request - HTTP request with FormData containing image
 * @param params - Route parameters containing product ID
 * @returns Success response with image URL and updated product
 */
export async function POST(
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
    // EXTRACT FILE FROM FORMDATA
    // -------------------------------------------------------------------------
    
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // ENSURE UPLOADS DIRECTORY EXISTS
    // -------------------------------------------------------------------------
    
    /**
     * Create uploads directory structure if it doesn't exist
     * Path: /public/uploads/products/
     */
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // -------------------------------------------------------------------------
    // GENERATE UNIQUE FILENAME
    // -------------------------------------------------------------------------
    
    /**
     * Filename format: [productId]-[timestamp].[extension]
     * This ensures uniqueness and easy association with product
     */
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${params.id}-${Date.now()}.${file.name.split('.').pop()}`
    const filepath = join(uploadsDir, filename)

    // -------------------------------------------------------------------------
    // SAVE FILE TO DISK
    // -------------------------------------------------------------------------
    
    await writeFile(filepath, buffer)

    // -------------------------------------------------------------------------
    // UPDATE PRODUCT WITH IMAGE PATH
    // -------------------------------------------------------------------------
    
    /**
     * Store relative path from /public for serving via Next.js static files
     */
    const imageUrl = `/uploads/products/${filename}`
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { image: imageUrl },
    })

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    return NextResponse.json({ 
      success: true, 
      imageUrl, 
      product 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
