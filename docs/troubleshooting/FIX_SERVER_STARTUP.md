# 🔧 Fix Server Startup Issues

## Common Issues and Fixes:

### Issue 1: Port Already in Use
**Symptom:** "EADDRINUSE" or "Port 3000 already in use"

**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue 2: Missing .env File
**Symptom:** "NEXTAUTH_SECRET is missing" or server won't start

**Fix:**
```bash
cd "/Users/akhil/Desktop/Restaurant app"
cat > .env << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-minimum-32-characters-long-12345678901234567890
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sai_datta?schema=public
EOF
```

### Issue 3: Missing Dependencies
**Symptom:** "Cannot find module" errors

**Fix:**
```bash
cd "/Users/akhil/Desktop/Restaurant app"
npm install
npm run dev
```

### Issue 4: Database Connection Error
**Symptom:** Database errors but server should still start

**Note:** Server will start even if database fails. You can test the UI.

### Issue 5: Permission Errors
**Symptom:** "EPERM" or "operation not permitted"

**Fix:**
```bash
# Check file permissions
ls -la .env
ls -la node_modules

# If needed, fix permissions
chmod 644 .env
```

---

## Step-by-Step Diagnostic:

### Step 1: Check if Server is Running
```bash
lsof -ti:3000
```
- Returns number → Server IS running ✅
- Returns nothing → Server is NOT running ❌

### Step 2: Check .env File
```bash
ls -la .env
cat .env
```
- File exists and has content → ✅
- File missing or empty → ❌ (create it)

### Step 3: Check Dependencies
```bash
ls node_modules
```
- Directory exists → ✅
- Missing → Run `npm install`

### Step 4: Try Starting Server
```bash
npm run dev
```
Watch for:
- ✅ "Ready" message → Success!
- ❌ Error messages → Share them

---

## Quick Fix Command:
```bash
cd "/Users/akhil/Desktop/Restaurant app"
# Kill any existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null
# Ensure .env exists
test -f .env || cat > .env << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-minimum-32-characters-long-12345678901234567890
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sai_datta?schema=public
EOF
# Start server
npm run dev
```

---

## What to Share:

If server still won't start, share:
1. **Full terminal output** from `npm run dev`
2. **Any error messages** (red text)
3. **Port number** if different from 3000

---

**Run the diagnostic steps above and share what you find!**

