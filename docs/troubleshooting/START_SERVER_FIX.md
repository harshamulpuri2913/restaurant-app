# Fix: Server Not Running (ERR_CONNECTION_REFUSED)

## The Problem
The server stopped or never started properly. Port 3003 is free, meaning nothing is listening on that port.

## Solution: Start the Server Manually

**Open your terminal and run these commands:**

```bash
cd "/Users/akhil/Desktop/Restaurant app"
npm run dev
```

## What You Should See:

```
▲ Next.js 14.2.5
- Local:        http://localhost:3000 (or 3001, 3002, 3003)
- Ready in 2.5s
```

**Wait for "Ready" message before opening the browser!**

## After Server Starts:

1. ✅ Check which port it's using (shown in terminal)
2. ✅ Update `.env` file with the correct port:
   ```env
   NEXTAUTH_URL=http://localhost:PORT_NUMBER
   ```
3. ✅ Open browser: `http://localhost:PORT_NUMBER`

## If You See Errors:

### Error: "NEXTAUTH_SECRET is missing"
**Fix:** Add to `.env`:
```env
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### Error: "Cannot connect to database"
**Fix:** Check `DATABASE_URL` in `.env` is correct

### Error: "Port already in use"
**Fix:** 
```bash
# Kill process on that port
lsof -ti:3000 | xargs kill -9
# Or use the port it suggests
```

## Keep Server Running:
- Don't close the terminal window
- Keep it running in the background
- Press Ctrl+C to stop when done

---

**Important:** The server must be running for the website to work. It's not a background service - you need to keep the terminal open.

