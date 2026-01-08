# Invested Items Feature - Setup Guide

## Overview
The Invested Items feature allows admins to create custom categories, subcategories, and items with flexible custom fields. This document explains the structure and how to set it up.

## Database Setup

**IMPORTANT:** Before using this feature, you must run these commands:

```bash
cd "/Users/akhil/Desktop/Restaurant app"
npm run db:push
npm run db:generate
```

Then **restart your development server**:
```bash
npm run dev
```

## Architecture

### Database Models

1. **InvestedItemCategory**
   - Main categories and subcategories (hierarchical)
   - Fields: `id`, `name`, `description`, `parentCategoryId`, `createdAt`, `updatedAt`
   - Self-referential relationship for subcategories

2. **InvestedItem**
   - Items with custom fields
   - Fields: `id`, `name`, `categoryId`, `customFields` (JSON), `createdAt`, `updatedAt`
   - Related to `InvestedItemCategory`

### API Routes Structure

```
app/api/invested-items/
├── route.ts                    # GET all items, POST create item
├── [id]/
│   └── route.ts               # PATCH update item, DELETE item
├── categories/
│   ├── route.ts               # GET all categories, POST create category
│   └── [id]/
│       └── route.ts           # PATCH update category, DELETE category
└── test/
    └── route.ts               # Test endpoint for database connection
```

### Utility Functions

**`lib/invested-items-utils.ts`** - Centralized utilities:
- `checkPrismaModels()` - Verifies Prisma models are available
- `formatErrorResponse()` - Standardized error formatting
- `validateCategoryData()` - Category validation
- `validateItemData()` - Item validation

## API Endpoints

### Categories

- **GET** `/api/invested-items/categories`
  - Returns all main categories with subcategories and item counts
  
- **POST** `/api/invested-items/categories`
  - Body: `{ name, description?, parentCategoryId? }`
  - Creates a new category or subcategory

- **PATCH** `/api/invested-items/categories/[id]`
  - Body: `{ name?, description?, parentCategoryId? }`
  - Updates a category

- **DELETE** `/api/invested-items/categories/[id]`
  - Deletes a category (only if no items or subcategories)

### Items

- **GET** `/api/invested-items?categoryId=xxx`
  - Returns all items (optionally filtered by category)
  
- **POST** `/api/invested-items`
  - Body: `{ name, categoryId, customFields? }`
  - Creates a new item with custom fields

- **PATCH** `/api/invested-items/[id]`
  - Body: `{ name?, categoryId?, customFields? }`
  - Updates an item

- **DELETE** `/api/invested-items/[id]`
  - Deletes an item

### Test Endpoint

- **GET** `/api/invested-items/test`
  - Tests database connection and model availability
  - Returns diagnostic information

## Error Handling

All API routes use centralized error handling:
- Checks Prisma model availability
- Provides clear error messages with solutions
- Handles Prisma-specific errors (P2002, P2025, etc.)
- Returns structured error responses

## Adding New Functionality

To add new features:

1. **Add new fields to schema** (`prisma/schema.prisma`)
   - Run `npm run db:push` and `npm run db:generate`
   - Restart server

2. **Update utility functions** (`lib/invested-items-utils.ts`)
   - Add validation functions if needed
   - Update error handling if required

3. **Update API routes**
   - Follow the existing pattern
   - Use utility functions for validation and error handling
   - Check Prisma models at the start of each route

4. **Update frontend** (`app/admin/invested-items/page.tsx`)
   - Add UI components for new fields
   - Update form state and handlers

## Common Issues

### "Cannot read properties of undefined (reading 'create')"
**Solution:** Run `npm run db:generate` and restart the server

### "Database models not available"
**Solution:** Run `npm run db:push && npm run db:generate` and restart the server

### "Category not found" or "Item not found"
**Solution:** Check if the ID exists in the database

## Code Structure

The code is organized for easy extension:

- **Centralized utilities** - All common functions in one place
- **Consistent error handling** - Same pattern across all routes
- **Type safety** - TypeScript interfaces for all data structures
- **Validation** - Input validation before database operations
- **Clear separation** - API routes, utilities, and frontend are separate

This structure makes it easy to add new features without breaking existing functionality.


