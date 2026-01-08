# Supabase Connection Troubleshooting

## Current Issue: Can't Reach Database Server

The error "Can't reach database server" usually means:

1. **Database is paused** (Supabase free tier pauses after inactivity)
2. **Need to use connection pooling URL** instead of direct connection
3. **Network/firewall restrictions**

## Solution 1: Wake Up Your Database

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. If you see "Paused" or "Resume" button, click it to wake up the database
4. Wait 30-60 seconds for it to start

## Solution 2: Use Connection Pooling (Recommended)

Supabase provides a connection pooling URL that's more reliable:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Look for **Connection pooling** (not "Direct connection")
4. Select **Session mode** or **Transaction mode**
5. Copy that connection string
6. It will look like:
   ```
   postgresql://postgres.quidvjbixhkdbrvvogkz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
7. Use this URL instead of the direct connection URL

## Solution 3: Check Your Connection String Format

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
```

**Important Notes:**
- If password has special characters, you might need to URL-encode them
- `$` should be `%24` if URL encoding is needed
- But try without encoding first (as shown above)

## Solution 4: Test Connection Manually

Test if you can reach the database:

```bash
# Install psql if you don't have it
# Then test connection:
psql "postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
```

## Quick Fix Steps

1. **Wake up database** in Supabase dashboard (if paused)
2. **Get connection pooling URL** from Supabase dashboard
3. **Update .env** with pooling URL
4. **Run**: `npm run db:push`

## Alternative: Use Supabase's Transaction Pooler

The transaction pooler URL format:
```
postgresql://postgres.quidvjbixhkdbrvvogkz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

This is more reliable than direct connection for applications.

