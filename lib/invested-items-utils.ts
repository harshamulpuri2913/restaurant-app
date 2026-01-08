/**
 * ============================================================================
 * INVESTED ITEMS UTILITIES
 * ============================================================================
 * Utility functions for the Invested Items feature API routes.
 * 
 * Invested Items tracks inventory/supplies that the restaurant has
 * purchased or invested in (ingredients, packaging, equipment, etc.)
 * 
 * Features:
 * - Prisma model availability checking
 * - Standardized error response formatting
 * - Input validation for categories and items
 * - Prisma error code handling
 * 
 * This module helps ensure graceful handling of scenarios where
 * database models may not yet be synced (e.g., after schema changes).
 */

import { prisma } from './prisma'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Result type for Prisma model availability check
 */
interface ModelsAvailable {
  available: true
}

interface ModelsNotAvailable {
  available: false
  missing: string[]
  solution: string
}

type ModelCheckResult = ModelsAvailable | ModelsNotAvailable

/**
 * Validation result type
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
}

// =============================================================================
// PRISMA MODEL CHECKING
// =============================================================================

/**
 * Check if required Prisma models are available
 * 
 * Verifies that the InvestedItemCategory and InvestedItem models
 * exist in the Prisma client. These models might be missing if:
 * - Schema hasn't been migrated yet
 * - Prisma client hasn't been regenerated after schema changes
 * 
 * @returns Object indicating availability status and any missing models
 * 
 * @example
 * const result = checkPrismaModels()
 * 
 * if (!result.available) {
 *   console.log('Missing:', result.missing)
 *   console.log('Solution:', result.solution)
 * }
 */
export function checkPrismaModels(): ModelCheckResult {
  // Check for category model
  const hasCategoryModel = 'investedItemCategory' in prisma
  
  // Check for item model
  const hasItemModel = 'investedItem' in prisma
  
  if (!hasCategoryModel || !hasItemModel) {
    const missing: string[] = []
    
    if (!hasCategoryModel) missing.push('InvestedItemCategory')
    if (!hasItemModel) missing.push('InvestedItem')
    
    return {
      available: false,
      missing,
      solution: 'Run: npm run db:push && npm run db:generate and restart the server',
    }
  }
  
  return { available: true }
}

// =============================================================================
// ERROR RESPONSE FORMATTING
// =============================================================================

/**
 * Format error responses with helpful information
 * 
 * Analyzes errors and returns user-friendly messages with:
 * - Prisma-specific error handling (duplicate entries, not found, etc.)
 * - Model availability check results
 * - Actionable solutions where possible
 * 
 * @param error - The caught error object
 * @param defaultMessage - Fallback message if error type is unknown
 * @returns Formatted error object for API response
 * 
 * @example
 * try {
 *   await prisma.investedItem.create({ ... })
 * } catch (error) {
 *   const formatted = formatErrorResponse(error, 'Failed to create item')
 *   return NextResponse.json(formatted, { status: 400 })
 * }
 */
export function formatErrorResponse(
  error: any,
  defaultMessage: string
): {
  error: string
  details?: string
  solution?: string
  originalError?: string
  code?: string
} {
  // ---------------------------------------------------------------------------
  // CHECK MODEL AVAILABILITY FIRST
  // ---------------------------------------------------------------------------
  
  const modelCheck = checkPrismaModels()
  
  if (!modelCheck.available) {
    return {
      error: 'Database models not available',
      details: `Missing models: ${modelCheck.missing.join(', ')}`,
      solution: modelCheck.solution,
      originalError: error?.message || String(error),
    }
  }
  
  // ---------------------------------------------------------------------------
  // HANDLE PRISMA-SPECIFIC ERRORS
  // ---------------------------------------------------------------------------
  
  /**
   * P2002: Unique constraint violation
   * Occurs when trying to create a duplicate entry
   */
  if (error?.code === 'P2002') {
    return {
      error: 'Duplicate entry',
      details: 'A record with this value already exists',
      originalError: error?.message,
    }
  }
  
  /**
   * P2025: Record not found
   * Occurs when trying to update/delete a non-existent record
   */
  if (error?.code === 'P2025') {
    return {
      error: 'Record not found',
      details: 'The requested record does not exist',
      originalError: error?.message,
    }
  }
  
  /**
   * Prisma client errors
   * Usually indicates client needs regeneration
   */
  if (error?.message?.includes('Unknown model') || error?.message?.includes('Cannot read properties')) {
    return {
      error: 'Prisma Client error',
      details: 'Prisma Client may not be up to date',
      solution: 'Run: npm run db:generate and restart the server',
      originalError: error?.message,
    }
  }
  
  // ---------------------------------------------------------------------------
  // DEFAULT ERROR FORMAT
  // ---------------------------------------------------------------------------
  
  return {
    error: defaultMessage,
    details: error?.message || String(error),
    code: error?.code,
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate category data for create/update operations
 * 
 * Checks:
 * - Name is required and non-empty
 * - Description is optional
 * - Parent category ID is optional (for nested categories)
 * 
 * @param data - Category data to validate
 * @returns Object with validation status and any error messages
 * 
 * @example
 * const validation = validateCategoryData({ name: '', description: 'Test' })
 * 
 * if (!validation.valid) {
 *   return NextResponse.json({ errors: validation.errors }, { status: 400 })
 * }
 */
export function validateCategoryData(data: {
  name?: string
  description?: string
  parentCategoryId?: string
}): ValidationResult {
  const errors: string[] = []
  
  // Name is required for category creation
  if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
    errors.push('Category name is required')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate item data for create/update operations
 * 
 * Checks:
 * - Name is required and non-empty
 * - Category ID is required (items must belong to a category)
 * 
 * @param data - Item data to validate
 * @returns Object with validation status and any error messages
 * 
 * @example
 * const validation = validateItemData({ name: 'Flour', categoryId: 'abc123' })
 * 
 * if (!validation.valid) {
 *   return NextResponse.json({ errors: validation.errors }, { status: 400 })
 * }
 */
export function validateItemData(data: {
  name?: string
  categoryId?: string
}): ValidationResult {
  const errors: string[] = []
  
  // Name is required for item creation
  if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
    errors.push('Item name is required')
  }
  
  // Category ID is required (items must belong to a category)
  if (data.categoryId !== undefined && !data.categoryId) {
    errors.push('Category is required')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
