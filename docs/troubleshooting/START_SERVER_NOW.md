# 🚨 CRITICAL: Start Server Now

## The Problem
Your server is **NOT running**. That's why you see "This site can't be reached".

## Step-by-Step Fix:

### Step 1: Open Terminal
Open Terminal app on your Mac (or use the terminal in your IDE).

### Step 2: Navigate to Project
```bash
cd "/Users/akhil/Desktop/Restaurant app"
```

### Step 3: Check if Dependencies are Installed
```bash
ls node_modules
```
If you see "No such file or directory", run:
```bash
npm install
```

### Step 4: Verify .env File Exists
```bash
ls -la .env
```
If it doesn't exist, create it (see Step 5).

### Step 5: Create/Verify .env File
```bash
cat > .env << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-minimum-32-characters-long-12345678901234567890
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sai_datta?schema=public
EOF
```

### Step 6: Start the Server
```bash
npm run dev
```

### Step 7: Wait for "Ready" Message
You should see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000

✓ Ready in X seconds
```

### Step 8: Open Browser
Go to: **http://localhost:3000**

---

## If You See Errors:

### Error: "Port 3000 already in use"
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Error: "Cannot find module"
```bash
npm install
```

### Error: "NEXTAUTH_SECRET is missing"
Make sure your `.env` file has `NEXTAUTH_SECRET` (see Step 5).

### Error: "Database connection failed"
The server will still start, but database features won't work. You can test the UI.

---

## Quick Test Command:
```bash
cd "/Users/akhil/Desktop/Restaurant app" && npm install && npm run dev
```

This will:
1. Install dependencies (if needed)
2. Start the server
3. Show you the URL to access

---

## Expected Output:
When server starts successfully, you'll see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000

✓ Ready in 2.3s
```

Then open **http://localhost:3000** in your browser!

