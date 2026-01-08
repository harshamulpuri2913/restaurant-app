# 🔍 Diagnosing Connection Issue

## The Error You're Seeing:
"This site can't be reached" - This means Chrome cannot connect to `localhost:3000`

## Possible Causes:

### 1. Server is NOT Running (Most Likely)
**Check:** Is `npm run dev` running in your terminal?
- If NO → Start it: `npm run dev`
- If YES → Check the port number shown

### 2. Server Running on Different Port
**Check:** Look at your terminal output. Does it say:
- `http://localhost:3000` ✅ Use this
- `http://localhost:3001` → Use this instead
- `http://localhost:3003` → Use this instead

### 3. Firewall Blocking Connection
**Fix:** Allow Node.js through firewall:
1. System Settings → Network → Firewall
2. Add Node.js to allowed apps
3. Or temporarily disable firewall to test

### 4. Port Already in Use
**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Start server
npm run dev
```

### 5. Server Crashed/Stopped
**Check terminal for errors:**
- Red error messages?
- "EADDRINUSE" → Port in use
- "ENOENT" → Missing file
- "ECONNREFUSED" → Database issue (server still starts)

---

## Step-by-Step Diagnosis:

### Step 1: Check if Server is Running
```bash
lsof -ti:3000
```
- If it returns a number → Server IS running
- If it returns nothing → Server is NOT running

### Step 2: Check Terminal Output
Look at the terminal where you ran `npm run dev`:
- Do you see "Ready" message? ✅
- Do you see error messages? ❌
- Is the terminal still open? ✅

### Step 3: Try Different URL
If server is on port 3001:
- Try: `http://localhost:3001`
- Or: `http://127.0.0.1:3001`

### Step 4: Check Browser Console
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share any errors you see

### Step 5: Check Network Tab
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Try to access `http://localhost:3000`
4. See if request shows "failed" or "pending"

---

## Quick Fix Commands:

```bash
# Navigate to project
cd "/Users/akhil/Desktop/Restaurant app"

# Kill any existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start fresh
npm run dev
```

Then wait for "Ready" message and try `http://localhost:3000` again.

---

## What to Share:

1. **Terminal output** - What do you see when running `npm run dev`?
2. **Port number** - What port is shown in terminal?
3. **Browser console errors** - Any red errors in DevTools Console?
4. **Network tab** - What does the request show?

---

**The most common issue: Server is not running. Make sure `npm run dev` is active in your terminal!**

