# Fix Google OAuth Sign-In Error

## Error: OAuthSignin

This error occurs when Google OAuth is not properly configured. Here's how to fix it:

## Step 1: Check Your .env File

Make sure you have these variables in your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3001"  # Or 3000 if using that port
```

## Step 2: Create Google OAuth Credentials

If you don't have credentials yet:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API" → Enable

4. **Configure OAuth Consent Screen**:
   - APIs & Services → OAuth consent screen
   - Choose "External" (unless you have Google Workspace)
   - App name: "Sai Datta Snacks & Savories"
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue through scopes (default is fine)
   - Add test users if needed
   - Save

5. **Create OAuth Client ID**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: "Restaurant App"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     http://localhost:3001/api/auth/callback/google
     ```
   - Click Create
   - Copy Client ID and Client Secret

## Step 3: Update .env File

Add the credentials to your `.env`:

```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
NEXTAUTH_URL="http://localhost:3001"
```

## Step 4: Restart Server

After updating `.env`, restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
PORT=3001 npm run dev
```

## Step 5: Test Again

1. Go to http://localhost:3001/signup
2. Click "Sign up with Google"
3. You should be redirected to Google sign-in
4. After signing in, you'll be redirected back

## Common Issues

### Issue 1: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Console **exactly** matches:
- `http://localhost:3001/api/auth/callback/google` (if using port 3001)
- Or `http://localhost:3000/api/auth/callback/google` (if using port 3000)

### Issue 2: "OAuth client not found"
**Solution**: 
- Check that `GOOGLE_CLIENT_ID` is correct
- Make sure there are no extra spaces in `.env` file
- Restart the server after updating `.env`

### Issue 3: "Access blocked"
**Solution**:
- Make sure OAuth consent screen is configured
- If testing, add your email as a test user
- For production, you'll need to verify your app

### Issue 4: Port Mismatch
**Solution**: 
- If you're using port 3001, make sure:
  - `NEXTAUTH_URL="http://localhost:3001"` in `.env`
  - Redirect URI in Google Console includes port 3001
  - You're accessing the app on port 3001

## Quick Checklist

- [ ] Google OAuth credentials created
- [ ] `GOOGLE_CLIENT_ID` in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env`
- [ ] `NEXTAUTH_URL` matches your port (3000 or 3001)
- [ ] Redirect URI in Google Console matches exactly
- [ ] Server restarted after updating `.env`
- [ ] OAuth consent screen configured

## Development Mode (Without Google OAuth)

If you want to test without Google OAuth for now:

1. The app will work with email/password signup
2. Google sign-in button will show an error (expected)
3. You can still test the full signup flow with email/password

## Need Help?

Check the server console for detailed error messages. The error will tell you exactly what's wrong with the OAuth configuration.


