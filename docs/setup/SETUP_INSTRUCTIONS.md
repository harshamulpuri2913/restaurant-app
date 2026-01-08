# Quick Setup Instructions

## ⚠️ IMPORTANT: You Need to Run These Commands First

The errors you're seeing are because Prisma Client doesn't have the new models yet. Follow these steps:

### Step 1: Stop the Server (if running)
Press `Ctrl+C` or `Cmd+C` in the terminal

### Step 2: Run Database Setup Commands
Open a new terminal and run:

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Create the database tables
npx prisma db push

# Regenerate Prisma Client with new models
npx prisma generate
```

### Step 3: Restart the Server
```bash
npm run dev
```

## What These Commands Do:

1. **`npx prisma db push`** - Creates the `InvestedItemCategory` and `InvestedItem` tables in your PostgreSQL database
2. **`npx prisma generate`** - Regenerates Prisma Client to include the new models
3. **Restart server** - Loads the new Prisma Client into memory

## After Setup:

✅ The errors will disappear
✅ You can create categories and items
✅ Everything will work perfectly

## Verify It Worked:

1. Visit: `http://localhost:3000/admin/invested-items`
2. You should see "No categories yet" (no errors)
3. Click "+ Add Category" - it should work!

---

**Note:** If you see any errors after running these commands, let me know and I'll help fix them!

