# Fixing Database Connection Issue

The database authentication is failing. Here's how to fix it:

## Option 1: Get Connection String from Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Select the **URI** tab (not "JDBC" or "Connection pooling")
6. Copy the **entire connection string** - it will have your password already formatted correctly
7. It should look like:
   ```
   postgresql://postgres.quidvjbixhkdbrvvogkz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres
   ```

8. Replace the `DATABASE_URL` in your `.env` file with this exact string

## Option 2: Verify Your Password

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Check if you see your database password
3. If you're not sure, click **Reset Database Password**
4. Set a new password (preferably without special characters like `$` or `]`)
5. Update your `.env` file with the new password

## Option 3: URL-Encode Special Characters

If your password contains special characters like `$` or `]`, you need to URL-encode them:

- `$` becomes `%24`
- `]` becomes `%5D`

Example: If your password is `mypass$123]`, the URL-encoded version would be `mypass%24123%5D`

Your DATABASE_URL should be:
```env
DATABASE_URL="postgresql://postgres:[YOUR-URL-ENCODED-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
```

## Option 4: Use Connection Pooling (Recommended for Production)

Supabase provides a connection pooling URL that might work better:

1. In Supabase Dashboard → **Settings** → **Database**
2. Look for **Connection pooling** section
3. Copy the **Session mode** connection string
4. Use that instead

## Test Your Connection

After updating your `.env` file, test the connection:

```bash
npm run db:push
```

If it works, you'll see:
```
✔ Database schema pushed successfully
```

## Current .env File

Make sure your `.env` file looks like this (with correct password):

```env
DATABASE_URL="postgresql://postgres:YOUR_CORRECT_PASSWORD@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-A-RANDOM-32-CHARACTER-STRING]"
WHATSAPP_ADMIN_NUMBER="[YOUR-PHONE-NUMBER]"
ADMIN_EMAIL="[YOUR-ADMIN-EMAIL]"
ADMIN_PASSWORD="[YOUR-SECURE-PASSWORD]"
```

## Quick Fix Steps

1. **Go to Supabase Dashboard** → Settings → Database
2. **Copy the URI connection string** (it has password pre-formatted)
3. **Update your .env file** with that exact string
4. **Run**: `npm run db:push`

This should work immediately!

