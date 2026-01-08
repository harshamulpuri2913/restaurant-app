# Supabase Connection Fix

## Current Issue

The database connection is failing. Here are ways to fix it:

## Option 1: Get Connection Pooling URL (Recommended)

The connection pooling URL is more reliable than direct connection:

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com
   - Select your project

2. **Get Connection Pooling URL:**
   - Settings → Database
   - Scroll to **Connection string**
   - Click **Connection pooling** tab (not "Direct connection")
   - Select **Session mode**
   - Copy the connection string

3. **Update .env file:**
   ```bash
   # Edit .env and replace DATABASE_URL with the pooling URL
   # It will look like:
   DATABASE_URL="postgresql://postgres.quidvjbixhkdbrvvogkz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```

## Option 2: Wake Up Database

Supabase free tier pauses databases after inactivity:

1. Go to Supabase Dashboard
2. If you see "Paused" or "Resume" button, click it
3. Wait 30-60 seconds
4. Try connecting again

## Option 3: Use Supabase REST API (Alternative)

If direct database connection doesn't work, you can use Supabase's REST API:

1. Get your Supabase URL and anon key from Dashboard
2. Use Supabase JavaScript client instead of Prisma for some operations

## Option 4: Test Connection Manually

If you have `psql` installed:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
```

## Quick Fix Script

Run this to update to connection pooling (after getting the URL from Supabase):

```bash
# Get the pooling URL from Supabase dashboard first, then:
# Update .env file with the new URL
# Then test:
npm run db:push
```

## Current Connection String

Your current connection string format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require
```

**Issue**: Direct connection might be blocked or database is paused.

**Solution**: Use connection pooling URL from Supabase dashboard.

