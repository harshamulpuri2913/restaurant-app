/**
 * ============================================================================
 * PRISMA CLIENT CONFIGURATION
 * ============================================================================
 * Singleton Prisma client instance for database operations.
 * 
 * This module implements the singleton pattern to prevent multiple Prisma
 * client instances in development (caused by Next.js hot-reloading).
 * 
 * Features:
 * - Single database connection across the app
 * - Development-friendly logging (errors and warnings)
 * - Production-optimized logging (errors only)
 * - Graceful fallback for initialization errors
 * 
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/prisma'
 * 
 * const users = await prisma.user.findMany()
 * ```
 * 
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

// =============================================================================
// GLOBAL SINGLETON SETUP
// =============================================================================

/**
 * Extend globalThis to store Prisma client instance
 * This prevents multiple instances during hot-reloading in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// =============================================================================
// PRISMA CLIENT INITIALIZATION
// =============================================================================

/**
 * Prisma client instance
 * Reuses existing instance from global scope in development
 */
let prismaClient: PrismaClient

try {
  /**
   * Create or reuse Prisma client
   * - In development: Reuse from globalForPrisma to prevent connection exhaustion
   * - In production: Create new instance (only runs once)
   * 
   * Logging configuration:
   * - Development: Log errors and warnings for debugging
   * - Production: Log only errors to reduce noise
   */
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
} catch (error) {
  /**
   * Fail if DATABASE_URL is not configured (security: no default credentials)
   * This prevents accidental connection to wrong database
   */
  throw new Error(
    'DATABASE_URL environment variable is required. ' +
    'Please configure it in your .env file.'
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Exported Prisma client instance
 * Use this for all database operations throughout the application
 */
export const prisma = prismaClient

/**
 * Store client in global scope for development hot-reloading
 * Only in non-production to prevent memory leaks in production
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
