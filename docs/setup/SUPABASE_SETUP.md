# Supabase Database Setup Guide

You have a Supabase database connection string. Here's how to complete the setup:

## Step 1: Get Your Supabase Password

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Database Password** section
5. If you haven't set a password yet:
   - Click **Reset Database Password**
   - Enter a strong password (save it securely!)
   - Click **Reset Password**
6. If you already have a password but forgot it:
   - Click **Reset Database Password**
   - Enter a new password

## Step 2: Format Your Connection String

Replace `[YOUR-PASSWORD]` with your actual password:

**Your connection string:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres
```

**Example (if your password is `MySecurePass123!`):**
```
postgresql://postgres:MySecurePass123!@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres
```

**Important:** If your password contains special characters, you may need to URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `?` becomes `%3F`
- `/` becomes `%2F`
- ` ` (space) becomes `%20`

## Step 3: Add to Your .env File

Create or update your `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres"
```

**For production (with SSL):**
```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.quidvjbixhkdbrvvogkz.supabase.co:5432/postgres?sslmode=require"
```

## Step 4: Test the Connection

1. Install dependencies (if not done):
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

3. Push schema to database:
   ```bash
   npm run db:push
   ```

If successful, you should see:
```
✔ Generated Prisma Client
✔ Database schema pushed successfully
```

## Step 5: Seed the Database

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit in your browser:
   ```
   http://localhost:3000/api/seed
   ```

   Or use curl:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

This will:
- Create an admin user
- Add all products from the flyer (Snacks, Sweets, Pickles)

## Alternative: Get Connection String from Supabase Dashboard

If you prefer, you can get the formatted connection string directly:

1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Select **URI** tab
6. Copy the connection string (it will have your password already filled in)
7. Add `?sslmode=require` at the end for production

## Troubleshooting

### Error: "password authentication failed"
- Double-check your password is correct
- Make sure there are no extra spaces
- Try resetting your database password in Supabase

### Error: "connection refused" or "timeout"
- Check if your IP is allowed (Supabase allows all IPs by default)
- Verify the hostname is correct: `db.quidvjbixhkdbrvvogkz.supabase.co`
- Check if port 5432 is accessible

### Error: "SSL connection required"
- Add `?sslmode=require` to the end of your connection string
- Supabase requires SSL for security

### Special Characters in Password
If your password has special characters that cause issues, you can:
1. Use a simpler password (letters, numbers, basic symbols)
2. Or URL-encode the special characters

## Security Note

⚠️ **Never commit your `.env` file to Git!**

The `.gitignore` file already excludes `.env`, but double-check:
- Your `.env` file should NOT be in version control
- Only share connection strings securely
- Use environment variables in your hosting platform (Vercel, etc.)

## Next Steps

Once your database is connected:

1. ✅ Database connected
2. ⏭️ Set up NextAuth (generate `NEXTAUTH_SECRET`)
3. ⏭️ Configure WhatsApp API (Twilio or Meta)
4. ⏭️ Deploy to production

See `PRODUCTION_SETUP.md` for complete deployment guide.

