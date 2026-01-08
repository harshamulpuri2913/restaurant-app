# Fix: "Operation not permitted" Error

## The Problem
macOS is blocking Next.js from reading files in `node_modules`. This is a macOS security restriction.

## Solution 1: Reinstall node_modules (Recommended)

**Run these commands in your terminal:**

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall everything
npm install

# Start the server
npm run dev
```

## Solution 2: Grant Full Disk Access (If Solution 1 doesn't work)

1. **Open System Settings** (or System Preferences on older macOS)
2. Go to **Privacy & Security** → **Full Disk Access**
3. Click the **+** button
4. Add your terminal app (Terminal, iTerm, or VS Code/Cursor)
5. Restart your terminal
6. Try `npm run dev` again

## Solution 3: Check File Permissions

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Fix permissions (may require sudo)
sudo chmod -R u+r node_modules

# Or reinstall
rm -rf node_modules
npm install
```

## Solution 4: Use a Different Terminal

Sometimes the terminal app doesn't have proper permissions. Try:
- Using Terminal.app instead of Cursor's integrated terminal
- Or vice versa

## After Fixing:

1. ✅ Run `npm run dev`
2. ✅ Should compile without "Operation not permitted" error
3. ✅ Server will start on a port (3000, 3001, etc.)

---

**Most Common Fix:** Solution 1 (reinstalling node_modules) usually resolves this issue.

