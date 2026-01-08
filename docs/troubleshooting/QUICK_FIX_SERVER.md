# 🚨 QUICK FIX: Get Server Running NOW

## The Problem
Your server won't start because the `.env` file is missing.

## The Solution (2 minutes)

### Option 1: Quick Start (Minimal Setup)

1. **Open Terminal** in your project folder

2. **Create .env file:**
```bash
cd "/Users/akhil/Desktop/Restaurant app"
touch .env
```

3. **Open .env file in a text editor** and paste this:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-minimum-32-characters-long-123456789012
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sai_datta?schema=public
```

4. **If you don't have PostgreSQL running:**
   - The server will still start but database features won't work
   - You can test the UI without a database

5. **Start the server:**
```bash
npm run dev
```

6. **Open browser:** `http://localhost:3000`

### Option 2: Use SQLite (No Database Setup Needed)

If you want to test without setting up PostgreSQL:

1. **Update `prisma/schema.prisma`** - Change the provider to `sqlite`
2. **Run:** `npm run db:push`
3. **Start server:** `npm run dev`

---

## Still Not Working?

Check your terminal for error messages. Common issues:

1. **Port 3000 already in use:**
   - Kill the process: `lsof -ti:3000 | xargs kill -9`
   - Or use a different port: `PORT=3001 npm run dev`

2. **Missing dependencies:**
   - Run: `npm install`

3. **Database connection error:**
   - Server will still start, but database features won't work
   - You can test the UI without database

---

## Need Help?

Share the error message from your terminal and I'll help you fix it!

