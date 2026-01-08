# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - Choose **External** (unless you have Google Workspace)
     - Fill in app name: "Sai Datta Snacks & Savories"
     - Add your email as support email
     - Add your email as developer contact
     - Save and continue through the scopes (default is fine)
     - Add test users if needed (for testing)
     - Save

5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Sai Datta Restaurant App"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `http://localhost:3001` (if using port 3001)
     - Your production URL (e.g., `https://your-app.vercel.app`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google` (if using port 3001)
     - `https://your-app.vercel.app/api/auth/callback/google` (production)
   - Click **Create**

6. Copy your credentials:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value (click to reveal)

## Step 2: Add to Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

## Step 3: Resend Email Setup

1. Go to [Resend](https://resend.com)
2. Sign up for a free account
3. Verify your email
4. Go to **API Keys** in dashboard
5. Click **Create API Key**
6. Name it: "Restaurant App"
7. Copy the API key
8. Add to `.env`:

```env
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="onboarding@resend.dev"  # Or use your verified domain
```

## Step 4: Test

1. Restart your development server
2. Go to `/signup` page
3. Click "Sign up with Google"
4. You should be redirected to Google sign-in
5. After signing in, you'll be redirected back to the app

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Console exactly matches:
  - `http://localhost:3001/api/auth/callback/google` (or your port)
- Check for trailing slashes
- Make sure you added both development and production URLs

### Email Not Sending
- Check Resend API key is correct
- Verify email domain in Resend (or use `onboarding@resend.dev` for testing)
- Check server logs for errors

### OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check that Google+ API is enabled
- Make sure OAuth consent screen is configured

## Production Setup

For production:
1. Add your production URL to Google OAuth authorized origins and redirect URIs
2. Update `NEXTAUTH_URL` in production environment
3. Use a verified domain in Resend for `EMAIL_FROM`
4. Test the complete flow in production


