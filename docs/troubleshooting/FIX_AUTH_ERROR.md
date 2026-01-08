# Fix Authentication Error

## The Problem
You're seeing `http://localhost:3001/api/auth/error` which means NextAuth is having a configuration issue.

## Common Causes:

### 1. Missing NEXTAUTH_SECRET
NextAuth requires a secret key. Add this to your `.env` file:

```bash
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random
```

**Quick fix:** Generate a random secret:
```bash
openssl rand -base64 32
```

### 2. Wrong NEXTAUTH_URL
If your server is running on port 3001, update `.env`:

```bash
NEXTAUTH_URL=http://localhost:3001
```

### 3. Server Not Running
Make sure the server is actually running:
```bash
npm run dev
```

## Step-by-Step Fix:

1. **Stop the server** (Ctrl+C)

2. **Check/Update `.env` file:**
   ```bash
   # Required for NextAuth
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3001
   
   # Database (should already be there)
   DATABASE_URL=your-database-url
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Try accessing:**
   - `http://localhost:3001` (homepage)
   - `http://localhost:3001/signin` (sign in page)

## If Still Not Working:

Check the terminal for error messages when you start the server. Common errors:
- "NEXTAUTH_SECRET is missing" → Add it to .env
- "Cannot connect to database" → Check DATABASE_URL
- "Port already in use" → Kill the process or use a different port

