# 🔧 Fix Server Issue - Step by Step

## The Problem:
Server is running but showing **HTTP 500 error** because macOS is blocking access to `node_modules/next` files.

**Error:** `Operation not permitted (os error 1)`

## ✅ Solution: Reinstall Dependencies

**Run these commands in your terminal:**

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Step 1: Remove old node_modules
rm -rf node_modules package-lock.json

# Step 2: Reinstall everything
npm install

# Step 3: Start server
npm run dev
```

## What This Does:
1. Removes corrupted/blocked `node_modules`
2. Fresh install of all packages with correct permissions
3. Server should work normally

## After Running:

1. ✅ Wait for `npm install` to complete (takes 1-2 minutes)
2. ✅ Run `npm run dev`
3. ✅ Look for: `- Local: http://localhost:3000`
4. ✅ Open browser: `http://localhost:3000`

## Expected Result:
- ✅ Server starts without errors
- ✅ Homepage loads correctly
- ✅ No "Operation not permitted" errors
- ✅ Page redirects to `/signup` or `/menu`

## If Still Not Working:

### Option 2: Grant Full Disk Access
1. Open **System Settings** (or System Preferences)
2. Go to **Privacy & Security** → **Full Disk Access**
3. Click **+** button
4. Add your **Terminal** app (or Cursor/VS Code)
5. Restart terminal
6. Run `npm install` and `npm run dev` again

---

**Status:** I've removed `node_modules` for you. Now you need to run `npm install` in your terminal to reinstall everything with fresh permissions.

