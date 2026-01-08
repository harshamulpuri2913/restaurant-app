# Quick Fix for Authentication Error

## The Issue
You're seeing `http://localhost:3001/api/auth/error` because NextAuth is not properly configured.

## Immediate Fix (3 Steps):

### Step 1: Check Your `.env` File
Open `.env` in your project root and make sure you have:

```env
# REQUIRED - Generate a random secret (see below)
NEXTAUTH_SECRET=your-secret-key-here

# REQUIRED - Match your port (3001 in your case)
NEXTAUTH_URL=http://localhost:3001

# REQUIRED - Your database connection
DATABASE_URL=your-database-url-here
```

### Step 2: Generate NEXTAUTH_SECRET
If you don't have `NEXTAUTH_SECRET`, generate one:

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use this online tool:** https://generate-secret.vercel.app/32

Copy the generated string and add it to `.env`:
```env
NEXTAUTH_SECRET=paste-generated-secret-here
```

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

## After Fixing:

1. ✅ Go to: `http://localhost:3001`
2. ✅ Should redirect to `/signup` or `/signin` (not `/api/auth/error`)
3. ✅ You can sign in/create account

## If Still Not Working:

Check your terminal for errors when starting the server. Look for:
- "NEXTAUTH_SECRET is missing"
- "Cannot connect to database"
- Any Prisma errors

---

**Note:** The port might be 3000 or 3001 depending on what's available. Check your terminal output to see which port Next.js is using, then update `NEXTAUTH_URL` accordingly.

