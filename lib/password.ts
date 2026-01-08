/**
 * ============================================================================
 * PASSWORD UTILITIES
 * ============================================================================
 * Centralized password hashing and verification using PBKDF2.
 * 
 * PBKDF2 (Password-Based Key Derivation Function 2) is:
 * - Built into Node.js (no external dependencies)
 * - Recommended by NIST (National Institute of Standards and Technology)
 * - More secure and future-proof than bcrypt
 * - Uses SHA-512 with 100,000 iterations
 * 
 * Hash Format:
 * - Stored as "salt:hash" (both hex encoded)
 * - Salt: 32 bytes (64 hex characters)
 * - Hash: 64 bytes (128 hex characters)
 * - Total: ~193 characters
 * 
 * Usage:
 * ```typescript
 * import { hashPassword, verifyPassword } from '@/lib/password'
 * 
 * // Hash a new password
 * const hashed = hashPassword('myPassword123')
 * 
 * // Verify a password
 * const isValid = verifyPassword('myPassword123', hashed)
 * ```
 */

import * as crypto from 'crypto'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * PBKDF2 parameters (NIST recommended values)
 * These match the settings used in the reset-password route
 */
const PBKDF2_ITERATIONS = 100000  // Number of iterations (higher = more secure but slower)
const PBKDF2_KEYLEN = 64          // Key length in bytes (64 bytes = 512 bits)
const PBKDF2_DIGEST = 'sha512'    // Hash function to use
const SALT_LENGTH = 32            // Salt length in bytes (32 bytes = 256 bits)

// =============================================================================
// PASSWORD HASHING
// =============================================================================

/**
 * Hash password using PBKDF2
 * 
 * This function:
 * 1. Generates a random salt
 * 2. Derives a key using PBKDF2 with SHA-512
 * 3. Returns the result in "salt:hash" format
 * 
 * @param password - Plain text password to hash
 * @returns string - Hashed password with salt embedded (format: "salt:hash")
 * 
 * @example
 * ```typescript
 * const hashed = hashPassword('mySecurePassword')
 * // Returns: "abc123...:def456..." (salt:hash format)
 * ```
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }

  // Generate a random salt (32 bytes = 256 bits)
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
  
  // Derive key using PBKDF2 (synchronous function)
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  )
  
  // Return format: salt:hash (both hex encoded)
  // This allows us to verify passwords later without storing salt separately
  return `${salt}:${hash.toString('hex')}`
}

// =============================================================================
// PASSWORD VERIFICATION
// =============================================================================

/**
 * Verify password against stored hash
 * 
 * This function:
 * 1. Extracts salt from stored hash
 * 2. Derives key using same PBKDF2 parameters
 * 3. Compares hashes using timing-safe comparison
 * 
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format "salt:hash"
 * @returns boolean - True if password matches, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = verifyPassword('mySecurePassword', storedHash)
 * // Returns: true if password matches, false otherwise
 * ```
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) {
    return false
  }

  try {
    // Split stored hash into salt and hash
    const [salt, hash] = storedHash.split(':')
    
    if (!salt || !hash) {
      return false
    }
    
    // Derive key using same parameters
    const verifyHash = crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    )
    
    // Compare hashes (timing-safe comparison to prevent timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      verifyHash
    )
  } catch {
    // Return false on any error (invalid format, etc.)
    return false
  }
}

// =============================================================================
// BCrypt COMPATIBILITY (For Migration Period)
// =============================================================================

/**
 * Check if a stored hash is in bcrypt format
 * 
 * Bcrypt hashes start with "$2a$", "$2b$", or "$2y$"
 * and have a specific structure.
 * 
 * @param storedHash - Stored password hash
 * @returns boolean - True if hash appears to be bcrypt format
 * 
 * @example
 * ```typescript
 * const isBcrypt = isBcryptHash(user.password)
 * // Returns: true if hash starts with "$2a$", "$2b$", or "$2y$"
 * ```
 */
export function isBcryptHash(storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== 'string') {
    return false
  }
  
  // Bcrypt hashes start with "$2a$", "$2b$", or "$2y$"
  // and are typically 60 characters long
  // They also don't contain ":" (unlike PBKDF2 format)
  return (
    (storedHash.startsWith('$2a$') ||
     storedHash.startsWith('$2b$') ||
     storedHash.startsWith('$2y$')) &&
    !storedHash.includes(':') &&
    storedHash.length === 60
  )
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Password hash format type
 * - 'pbkdf2': PBKDF2 format (salt:hash)
 * - 'bcrypt': Bcrypt format (legacy, for migration)
 */
export type PasswordHashFormat = 'pbkdf2' | 'bcrypt'

/**
 * Detect password hash format
 * 
 * @param storedHash - Stored password hash
 * @returns PasswordHashFormat - Format of the stored hash
 */
export function detectHashFormat(storedHash: string): PasswordHashFormat {
  if (isBcryptHash(storedHash)) {
    return 'bcrypt'
  }
  if (storedHash.includes(':')) {
    return 'pbkdf2'
  }
  // Default to pbkdf2 if format is unclear
  return 'pbkdf2'
}

