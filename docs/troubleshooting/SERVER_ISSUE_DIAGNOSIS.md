# Server Issue Diagnosis

## Current Status:
- ✅ Server is running on port 3000
- ❌ Returning HTTP 500 error
- ❌ Cannot read Next.js files due to macOS permissions

## The Error:
```
Error: Failed to read source code from 
/Users/akhil/Desktop/Restaurant app/node_modules/next/dist/client/components/router-reducer/create-href-from-url.js

Caused by: Operation not permitted (os error 1)
```

## Root Cause:
macOS is blocking access to `node_modules` directory. This is a macOS security feature (Full Disk Access or System Integrity Protection).

## Solution Options:

### Option 1: Reinstall node_modules (Recommended)
```bash
cd "/Users/akhil/Desktop/Restaurant app"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Option 2: Grant Full Disk Access
1. System Settings → Privacy & Security → Full Disk Access
2. Add Terminal/Cursor to allowed apps
3. Restart terminal
4. Run `npm run dev`

### Option 3: Fix Permissions (May require sudo)
```bash
cd "/Users/akhil/Desktop/Restaurant app"
sudo chmod -R u+r node_modules
npm run dev
```

## Quick Fix Command:
```bash
cd "/Users/akhil/Desktop/Restaurant app"
rm -rf node_modules package-lock.json && npm install && npm run dev
```

