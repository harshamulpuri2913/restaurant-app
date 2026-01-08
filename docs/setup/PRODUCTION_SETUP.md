# Production Deployment Configuration Guide

This guide explains exactly what credentials and configurations you need to deploy the application to production.

## 1. Database Configuration (PostgreSQL)

### Required: `DATABASE_URL`

You need a PostgreSQL database connection string. Here are your options:

#### Option A: Vercel Postgres (Recommended - Easiest)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing
3. Go to **Storage** → **Create Database** → **Postgres**
4. Copy the connection string
5. Format: `postgresql://user:password@host:5432/database?sslmode=require`

#### Option B: Supabase (Free Tier Available)
1. Sign up at [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string under "Connection string" → "URI"
5. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

#### Option C: Railway (Simple Setup)
1. Sign up at [Railway](https://railway.app)
2. Create new project → **Add PostgreSQL**
3. Click on PostgreSQL service → **Variables** tab
4. Copy the `DATABASE_URL` value

#### Option D: AWS RDS (Production-Grade)
1. Create RDS PostgreSQL instance in AWS Console
2. Get connection details: host, port, database name, username, password
3. Format: `postgresql://username:password@host:5432/database?sslmode=require`

#### Option E: Local PostgreSQL (Development Only)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sai_datta_restaurant?schema=public"
```

**What you need:**
- Database host/URL
- Database name
- Username
- Password
- Port (usually 5432)

---

## 2. NextAuth Configuration

### Required: `NEXTAUTH_SECRET`

Generate a secure random string (32+ characters):

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use online generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Example:**
```env
NEXTAUTH_SECRET="aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3"
```

### Required: `NEXTAUTH_URL`

Set to your production domain:

**For Vercel deployment:**
```env
NEXTAUTH_URL="https://your-app-name.vercel.app"
```

**For custom domain:**
```env
NEXTAUTH_URL="https://www.yourdomain.com"
```

**For local development:**
```env
NEXTAUTH_URL="http://localhost:3000"
```

---

## 3. WhatsApp API Configuration

You have **two options** for WhatsApp integration. Choose one:

### Option 1: Twilio WhatsApp API (Recommended - Easier Setup)

#### Step 1: Create Twilio Account
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Verify your email and phone number
3. Get your Account SID and Auth Token from the dashboard

#### Step 2: Enable WhatsApp Sandbox (For Testing)
1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the sandbox
3. You'll get a sandbox number like: `whatsapp:+14155238886`

#### Step 3: Get Production WhatsApp Number (For Production)
1. Go to **Phone Numbers** → **Buy a number** → **WhatsApp-enabled numbers**
2. Purchase a WhatsApp-enabled number
3. Note the number format: `whatsapp:+1234567890`

#### Required Environment Variables:
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"
```

**Where to find:**
- **Account SID**: Dashboard homepage (starts with `AC`)
- **Auth Token**: Dashboard homepage (click to reveal)
- **WhatsApp Number**: Your purchased WhatsApp number

**Cost:** ~$0.005 per message (very affordable)

---

### Option 2: WhatsApp Business API (Meta) - More Complex

#### Step 1: Create Meta Business Account
1. Go to [Meta Business](https://business.facebook.com)
2. Create a business account
3. Verify your business

#### Step 2: Create WhatsApp Business App
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app → Select "Business" type
3. Add "WhatsApp" product to your app

#### Step 3: Get API Credentials
1. In your app dashboard, go to **WhatsApp** → **API Setup**
2. Copy the following:
   - **Phone Number ID**: Found in API Setup
   - **Access Token**: Generate a permanent token (requires app review for production)

#### Step 4: Get Phone Number
1. In WhatsApp API Setup, you'll see your phone number
2. Format: `+1234567890` (with country code)

#### Required Environment Variables:
```env
WHATSAPP_API_KEY="your_permanent_access_token_here"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_PHONE_NUMBER="+1234567890"
```

**Note:** For production, you need to:
- Complete Meta Business Verification
- Submit app for review
- Get approved for production use

**Cost:** Free for first 1,000 conversations/month, then paid

---

### Required: Admin WhatsApp Number

This is where order notifications will be sent:

```env
WHATSAPP_ADMIN_NUMBER="2095978565"
```

**Format:** Include country code without + sign, or with + sign depending on your API provider
- For Twilio: `+12095978565` or `2095978565`
- For Meta: `+12095978565`

---

## 4. Admin Account Configuration

### Required: Initial Admin Credentials

Set these for the first admin user (created during database seeding):

```env
ADMIN_EMAIL="admin@sai-datta.com"
ADMIN_PASSWORD="[YOUR-SECURE-PASSWORD]"
```

**⚠️ IMPORTANT:** 
- Change these in production!
- Use a strong password (12+ characters, mixed case, numbers, symbols)
- The seed script will create this admin account

---

## 5. Complete Production .env File

Here's a complete example of your production `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-generated-secret-key-32-chars-minimum"

# WhatsApp - Option 1: Twilio
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"

# OR WhatsApp - Option 2: Meta Business API
# WHATSAPP_API_KEY="your_meta_access_token"
# WHATSAPP_PHONE_NUMBER_ID="123456789012345"
# WHATSAPP_PHONE_NUMBER="+1234567890"

# Admin WhatsApp (where orders are sent)
WHATSAPP_ADMIN_NUMBER="[YOUR-PHONE-NUMBER]"

# Initial Admin Account
ADMIN_EMAIL="admin@sai-datta.com"
ADMIN_PASSWORD="[YOUR-STRONG-PASSWORD]"
```

---

## 6. Deployment Steps

### Deploy to Vercel (Recommended)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables (copy from your `.env` file)
   - Deploy!

3. **Set up database:**
   - In Vercel dashboard, go to **Storage** → **Create Database** → **Postgres**
   - Copy the `DATABASE_URL` and add it to your environment variables
   - Run migrations: In Vercel dashboard → Your project → **Settings** → **Environment Variables**
   - Or run locally: `npm run db:push`

4. **Seed database:**
   - Visit: `https://your-app.vercel.app/api/seed`
   - This creates admin user and products

### Deploy to Other Platforms

**Netlify, Railway, Render:** Similar process - add environment variables in their dashboard.

---

## 7. Testing Your Setup

### Test Database Connection:
```bash
npm run db:push
```
Should complete without errors.

### Test Authentication:
1. Visit your app URL
2. Sign in with admin credentials
3. Should redirect to menu page

### Test WhatsApp:
1. Create an order
2. Confirm the order
3. Check your admin WhatsApp number for the message
4. If using Twilio sandbox, make sure you've joined the sandbox first

---

## 8. Security Checklist

- [ ] Changed default admin password
- [ ] Using strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Database uses SSL connection (`sslmode=require`)
- [ ] Environment variables are set in hosting platform (not in code)
- [ ] WhatsApp API credentials are secure
- [ ] Using HTTPS in production (`NEXTAUTH_URL` starts with `https://`)

---

## 9. Quick Reference: What You Need

| Item | Where to Get | Example |
|------|-------------|---------|
| **Database URL** | Vercel/Supabase/Railway dashboard | `postgresql://user:pass@host:5432/db` |
| **NEXTAUTH_SECRET** | Generate with `openssl rand -base64 32` | `aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3` |
| **NEXTAUTH_URL** | Your production domain | `https://your-app.vercel.app` |
| **Twilio Account SID** | Twilio dashboard | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **Twilio Auth Token** | Twilio dashboard | `your_auth_token_here` |
| **Twilio WhatsApp #** | Twilio → Phone Numbers | `whatsapp:+1234567890` |
| **Meta Access Token** | Meta Developers → App Dashboard | `EAABwzLix...` |
| **Meta Phone Number ID** | Meta Developers → WhatsApp API Setup | `123456789012345` |
| **Admin WhatsApp #** | Your phone number | `2095978565` |

---

## 10. Support & Troubleshooting

### Database Connection Issues:
- Verify connection string format
- Check if database allows connections from your IP
- Ensure SSL is enabled for cloud databases

### WhatsApp Not Sending:
- Check API credentials are correct
- Verify phone number format (include country code)
- Check API logs/console for errors
- For Twilio: Ensure you've joined the sandbox (for testing)
- For Meta: Verify app is approved for production

### Authentication Issues:
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set and not empty
- Ensure cookies are enabled in browser

---

## Recommendation

**For easiest setup:**
1. Use **Vercel Postgres** (built-in, free tier available)
2. Use **Twilio WhatsApp** (easier than Meta, good pricing)
3. Deploy to **Vercel** (automatic deployments from GitHub)

This combination gives you the fastest path to production with minimal configuration.

