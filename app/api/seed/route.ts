/**
 * ============================================================================
 * DATABASE SEED API ROUTE
 * ============================================================================
 * Development/setup endpoint for seeding the database with initial data.
 * 
 * Endpoints:
 * - POST /api/seed - Seed database with admin user and sample products
 * 
 * Features:
 * - Creates or updates admin user
 * - Seeds sample product catalog
 * - Uses upsert to prevent duplicate admin
 * - Clears existing products before seeding
 * 
 * Sample Data Includes:
 * - Admin user (from environment variables or defaults)
 * - Snacks (Chekkalu, Karapusa, Ribbon Pakodi, etc.)
 * - Sweets (Boondi Chikki, Laddu, Sunnundalu, etc.)
 * - Pickles (Cauliflower, Chicken Boneless)
 * 
 * WARNING: This endpoint clears all existing products!
 * Only use for initial setup or development reset.
 * 
 * Environment Variables (Required):
 * - ADMIN_EMAIL: Admin user email (required)
 * - ADMIN_PASSWORD: Admin user password (required - no default for security)
 * 
 * @public - No authentication required (for initial setup)
 * @warning Destructive operation - clears products table
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

// =============================================================================
// POST - SEED DATABASE
// =============================================================================

/**
 * Seed database with initial data
 * 
 * Creates admin user and populates product catalog.
 * This is designed for initial app setup.
 * 
 * CAUTION: This endpoint deletes all existing products!
 * 
 * @returns Success message with admin email
 */
export async function POST() {
  try {
    // -------------------------------------------------------------------------
    // CREATE/UPDATE ADMIN USER
    // -------------------------------------------------------------------------
    
    /**
     * Validate required environment variables
     * Security: No default credentials allowed
     */
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { 
          error: 'Missing required environment variables',
          message: 'ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file'
        },
        { status: 400 }
      )
    }

    /**
     * Hash admin password with PBKDF2 (via shared utility)
     * Password is required from environment variable (no default)
     */
    const adminPassword = hashPassword(process.env.ADMIN_PASSWORD)

    /**
     * Upsert admin user
     * - If exists: Update emailVerified to true
     * - If not exists: Create with admin role
     */
    const admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {
        emailVerified: true,
      },
      create: {
        email: process.env.ADMIN_EMAIL,
        password: adminPassword,
        name: 'Admin',
        role: 'admin',
        emailVerified: true,
      },
    })

    // -------------------------------------------------------------------------
    // DEFINE SAMPLE PRODUCTS
    // -------------------------------------------------------------------------
    
    /**
     * Product catalog based on Sai Datta Snacks & Savories menu
     * Organized by category: snacks, sweets, pickles
     */
    const products = [
      // Snacks Category
      { name: 'Chekkalu', category: 'snacks', price: 7, unit: '250g' },
      { name: 'Karapusa', category: 'snacks', price: 7, unit: '250g' },
      { name: 'Ribbon Pakodi', category: 'snacks', price: 7, unit: '250g' },
      { name: 'Palli Pokodi', category: 'snacks', price: 8, unit: '250g' },
      { name: 'Boondi', category: 'snacks', price: 7, unit: '250g' },
      { name: 'Boondi Mixture', category: 'snacks', price: 7, unit: '250g' },
      { name: 'Chakkidalu', category: 'snacks', price: 7, unit: '250g' },
      
      // Sweets Category
      { name: 'Boondi Chikki', category: 'sweets', price: 7, unit: '250g' },
      { name: 'Gavvalu', category: 'sweets', price: 7, unit: '250g' },
      { name: 'Palli Chikki', category: 'sweets', price: 7, unit: '250g' },
      { name: 'Gorimitikilu', category: 'sweets', price: 7, unit: '250g' },
      { name: 'Laddu', category: 'sweets', price: 1, unit: 'Each' },
      { name: 'Sunnundalu', category: 'sweets', price: 1.5, unit: 'Each' },
      { name: 'Kajikayalu', category: 'sweets', price: 1, unit: 'Each' },
      
      // Pickles Category
      { name: 'Cauliflower Pickle', category: 'pickles', price: 7, unit: '250g' },
      { name: 'Chicken Pickle (Boneless)', category: 'pickles', price: 10, unit: '250g' },
    ]

    // -------------------------------------------------------------------------
    // SEED PRODUCTS
    // -------------------------------------------------------------------------
    
    /**
     * WARNING: Clears all existing products before seeding
     * This ensures a clean slate for the sample data
     */
    await prisma.product.deleteMany({})
    await prisma.product.createMany({ data: products })

    // -------------------------------------------------------------------------
    // RETURN SUCCESS RESPONSE
    // -------------------------------------------------------------------------
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      adminEmail: admin.email,
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to seed database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
