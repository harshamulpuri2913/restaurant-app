# Security Guidelines

## 🔒 Environment Variables

**NEVER commit the following to Git:**
- `.env` files
- `.env.local` files
- Any file containing actual API keys, secrets, or passwords

## ✅ Safe to Commit

- `.env.example` (template with placeholder values)
- Configuration files (without secrets)
- Source code (without hardcoded credentials)

## 🔑 Required Environment Variables

All sensitive data must be stored in environment variables:

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Authentication
- `NEXTAUTH_SECRET` - Secret key for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL
- `GOOGLE_CLIENT_ID` - (Optional) Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - (Optional) Google OAuth client secret

### Email
- `RESEND_API_KEY` - (Optional) Resend API key for email

### WhatsApp
- `TWILIO_ACCOUNT_SID` - (Optional) Twilio account SID
- `TWILIO_AUTH_TOKEN` - (Optional) Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - (Optional) Twilio WhatsApp number
- `WHATSAPP_API_KEY` - (Optional) Meta WhatsApp API key
- `WHATSAPP_PHONE_NUMBER_ID` - (Optional) Meta phone number ID
- `WHATSAPP_PHONE_NUMBER` - (Optional) Meta phone number
- `WHATSAPP_ADMIN_NUMBER` - Admin phone number for notifications

### Admin
- `ADMIN_EMAIL` - Initial admin email
- `ADMIN_PASSWORD` - Initial admin password (change in production!)

## 🛡️ Security Best Practices

1. **Never hardcode secrets** - Always use environment variables
2. **Rotate secrets regularly** - Change passwords and API keys periodically
3. **Use strong passwords** - 12+ characters, mixed case, numbers, symbols
4. **Enable 2FA** - On all service accounts (GitHub, hosting, etc.)
5. **Review access** - Regularly audit who has access to your repositories
6. **Use secrets management** - For production, use services like:
   - Vercel Environment Variables
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager

## 📝 Before Committing to Git

1. ✅ Check `.gitignore` includes `.env*` files
2. ✅ Verify no secrets in code (search for `password`, `secret`, `key`, `token`)
3. ✅ Use `.env.example` as template
4. ✅ Review all files in staging area
5. ✅ Test that app works with environment variables

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate the exposed secret**
2. **Remove from Git history** (if possible)
3. **Notify your team**
4. **Review access logs**

## 🔍 Security Checklist

- [ ] No `.env` files in repository
- [ ] No hardcoded API keys or passwords
- [ ] `.env.example` exists with placeholders
- [ ] `.gitignore` properly configured
- [ ] All API routes have authentication checks
- [ ] Admin routes are protected
- [ ] Database connection uses SSL in production
- [ ] HTTPS enabled in production
- [ ] Security headers configured in `next.config.js`

