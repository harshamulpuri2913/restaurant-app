# ⚠️ CRITICAL: Create .env File

Your server cannot start without a `.env` file. Follow these steps:

## Step 1: Create .env File

In your terminal, run these commands:

```bash
cd "/Users/akhil/Desktop/Restaurant app"
```

Then create the `.env` file with this content:

```bash
cat > .env << 'ENVFILE'
# Minimum required for development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production-minimum-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/sai_datta_restaurant?schema=public

# Optional - for full functionality
ADMIN_EMAIL=admin@sai-datta.com
ADMIN_PASSWORD=[YOUR-SECURE-PASSWORD]
WHATSAPP_ADMIN_NUMBER=[YOUR-PHONE-NUMBER]
ENVFILE
```

## Step 2: Update DATABASE_URL

Replace the `DATABASE_URL` with your actual database connection string:
- If using local PostgreSQL: `postgresql://username:password@localhost:5432/sai_datta_restaurant?schema=public`
- If using Supabase/Vercel/Railway: Use the connection string from your provider

## Step 3: Start Server

```bash
npm run dev
```

## Step 4: Verify

Open your browser and go to: `http://localhost:3000`

---

**If you don't have a database yet:**
1. Install PostgreSQL locally, OR
2. Sign up for a free database at:
   - Supabase (https://supabase.com) - Free tier available
   - Vercel Postgres (https://vercel.com) - Free tier available
   - Railway (https://railway.app) - Free tier available

Then update the `DATABASE_URL` in your `.env` file.

