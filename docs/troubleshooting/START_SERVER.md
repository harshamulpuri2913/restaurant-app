# How to Start the Server

## The Issue
The server needs to be started manually in your terminal because it requires network access to bind to port 3000.

## Quick Fix - Run This Command:

Open your terminal and run:

```bash
cd "/Users/akhil/Desktop/Restaurant app"
npm run dev
```

## What You Should See:

```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Ready in 2.5s
```

## If You See Errors:

### Error: "Port 3000 is already in use"
**Solution:** Kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Error: "Cannot find module"
**Solution:** Install dependencies:
```bash
npm install
npm run dev
```

### Error: "Database connection failed"
**Solution:** Check your `.env` file has `DATABASE_URL` set correctly.

## After Server Starts:

1. ✅ Open browser: `http://localhost:3000`
2. ✅ Login as admin
3. ✅ Go to: `http://localhost:3000/admin/invested-items`
4. ✅ You should see no errors!

---

**Note:** The database setup is complete (tables created, Prisma Client generated). You just need to start the server now.

