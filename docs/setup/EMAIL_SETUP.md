# Email Setup Guide - Why Emails Aren't Sending

## Current Issue

**Emails are not being sent to your Gmail because the Resend API key is not configured.**

When you click "Resend Verification Email", the app:
1. ✅ Generates a verification token
2. ✅ Saves it to the database
3. ❌ **Cannot send email** (Resend API key missing)
4. ✅ Shows verification link on the page (in development mode)

## Quick Fix - Get Verification Link

**Right now, when you click "Resend Verification Email", the verification link will appear on the page below the button.** You can click it directly to verify your email.

## Permanent Solution - Set Up Resend

### Step 1: Sign Up for Resend (Free)

1. Go to [Resend.com](https://resend.com)
2. Click "Sign Up" (free tier: 3,000 emails/month)
3. Verify your email address
4. Complete the signup process

### Step 2: Get Your API Key

1. After logging in, go to **API Keys** in the dashboard
2. Click **"Create API Key"**
3. Name it: "Restaurant App"
4. Copy the API key (starts with `re_`)

### Step 3: Add to .env File

Open your `.env` file and add:

```env
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="onboarding@resend.dev"
```

**Note:** `onboarding@resend.dev` works for testing. For production, you'll need to verify your own domain.

### Step 4: Restart Server

After adding the API key, restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
PORT=3001 npm run dev
```

### Step 5: Test

1. Go to http://localhost:3001/verify-email
2. Click "Resend Verification Email"
3. Check your Gmail inbox
4. Click the verification link in the email

## Alternative: Check Server Logs

If you don't want to set up Resend right now, you can find the verification link in your server console logs. When you click "Resend Verification Email", the server logs will show:

```
Resend API key not configured. Email would be sent to: your-email@gmail.com
Verification URL: http://localhost:3001/verify-email?token=...
```

You can copy that URL and open it in your browser to verify your email.

## Why This Happens

The app is designed to work in development mode without email service. When Resend API key is missing:
- ✅ User accounts are created
- ✅ Verification tokens are generated
- ✅ Verification links are shown on the page
- ❌ Emails are not sent (but links are available)

This allows you to test the app without setting up email service immediately.

## Production Setup

For production, you'll need:
1. Resend API key (or another email service)
2. Verified domain for `EMAIL_FROM`
3. Update `NEXTAUTH_URL` to your production URL

See `PRODUCTION_SETUP.md` for more details.


