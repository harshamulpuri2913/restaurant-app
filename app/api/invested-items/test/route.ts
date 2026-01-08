/**
 * ============================================================================
 * INVESTED ITEMS TEST API ROUTE
 * ============================================================================
 * Development endpoint for testing database connection and model availability.
 * 
 * Endpoints:
 * - GET /api/invested-items/test - Test database and Prisma models
 * 
 * Features:
 * - Verify Prisma Client has required models
 * - Test database connection
 * - Return diagnostic information
 * - List available Prisma models
 * 
 * Use Cases:
 * - Debugging schema sync issues
 * - Verifying database setup
 * - Troubleshooting after schema changes
 * 
 * Access Control:
 * - Admin only - Diagnostic endpoint restricted to administrators
 * 
 * @requires Admin role
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// =============================================================================
// GET - TEST DATABASE CONNECTION
// =============================================================================

/**
 * Test database connection and model availability
 * 
 * Performs two-step verification:
 * 1. Check if Prisma Client has the InvestedItemCategory model
 * 2. Attempt to query the database
 * 
 * Useful for diagnosing issues after:
 * - Schema changes
 * - Database migrations
 * - Prisma client regeneration
 * 
 * Response includes:
 * - success: Whether all tests passed
 * - modelExists: Whether the model is in Prisma Client
 * - categoryCount: Number of categories (if query succeeds)
 * - prismaModels: List of available Prisma models
 * - error/solution: Diagnostic info if something fails
 * 
 * @returns Diagnostic information about database and models
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
    // TEST 1: CHECK PRISMA CLIENT MODEL AVAILABILITY
    // -------------------------------------------------------------------------
    
    /**
     * Check if the investedItemCategory model exists in Prisma Client
     * This can fail if:
     * - Schema was changed but client wasn't regenerated
     * - npm run db:generate wasn't run after schema changes
     */
    const hasModel = 'investedItemCategory' in prisma
    
    if (!hasModel) {
      return NextResponse.json({
        success: false,
        error: 'Prisma Client does not have investedItemCategory model',
        solution: 'Run: npm run db:generate',
        prismaModels: Object.keys(prisma).filter(
          key => !key.startsWith('_') && !key.startsWith('$')
        ),
      }, { status: 500 })
    }

    // -------------------------------------------------------------------------
    // TEST 2: TEST DATABASE QUERY
    // -------------------------------------------------------------------------
    
    /**
     * Attempt to query the database
     * This can fail if:
     * - Database table doesn't exist
     * - Connection issues
     * - Schema mismatch
     */
    try {
      const count = await prisma.investedItemCategory.count()
      
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        modelExists: true,
        categoryCount: count,
        prismaModels: Object.keys(prisma).filter(
          key => !key.startsWith('_') && 
                 !key.startsWith('$') && 
                 typeof prisma[key as keyof typeof prisma] === 'object'
        ),
      })
    } catch (dbError: any) {
      /**
       * Query failed - database table may not exist
       * Suggest running db:push to sync schema
       */
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: dbError?.message || String(dbError),
        modelExists: hasModel,
        solution: 'Run: npm run db:push',
        prismaError: dbError?.code || 'UNKNOWN',
      }, { status: 500 })
    }
  } catch (error: any) {
    /**
     * Unexpected error - return full diagnostic info in development
     */
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 500 })
  }
}
