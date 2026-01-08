# Fix: Blank Page Issue

## The Problem
You're seeing a blank page because NextAuth might not be properly configured, causing the session check to fail silently.

## Quick Fixes:

### 1. Check Your `.env` File
Make sure you have these in your `.env` file:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your-database-url
```

### 2. Generate NEXTAUTH_SECRET (if missing)
```bash
openssl rand -base64 32
```

Add the output to `.env`:
```env
NEXTAUTH_SECRET=paste-generated-secret-here
```

### 3. Check Browser Console
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for any red error messages
4. Share those errors if you see any

### 4. Try Direct URLs
Instead of the homepage, try:
- `http://localhost:3000/signin` - Sign in page
- `http://localhost:3000/signup` - Sign up page
- `http://localhost:3000/menu` - Menu page

### 5. Restart Server After Updating .env
```bash
# Stop server (Ctrl+C)
# Update .env file
# Restart:
npm run dev
```

## What I've Fixed:

1. ✅ Added error handling to homepage to show configuration errors
2. ✅ Added mounted check to Providers to prevent hydration issues
3. ✅ Better error messages if NextAuth isn't configured

## Common Causes:

1. **Missing NEXTAUTH_SECRET** - Most common cause
2. **Wrong NEXTAUTH_URL** - Must match your port (3000, 3001, etc.)
3. **JavaScript errors** - Check browser console
4. **CSS not loading** - Check Network tab in DevTools

## Next Steps:

1. Check your `.env` file has all required variables
2. Restart the server
3. Open browser console and check for errors
4. Try accessing `/signin` or `/signup` directly

