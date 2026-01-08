# Fixing npm Permission Issues

You're encountering a system-level npm permission error. Here's how to fix it:

## Quick Fix Options

### Option 1: Fix npm Permissions (Recommended)

Run these commands in your terminal:

```bash
# Create a directory for global npm packages
mkdir -p ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your shell profile (choose one based on your shell)

# For Zsh (default on macOS):
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# OR for Bash:
# echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bash_profile
# source ~/.bash_profile
```

Then try again:
```bash
cd "/Users/akhil/Desktop/Restaurant app"
npm install
```

### Option 2: Use npx Directly (Bypass npm)

If npm still doesn't work, you can use npx directly:

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Install packages using npx
npx --yes npm install

# Or install packages one by one
npx --yes next@14.2.5
npx --yes react@^18.3.1
npx --yes react-dom@^18.3.1
npx --yes @prisma/client@^5.19.1
npx --yes next-auth@^4.24.7
npx --yes bcryptjs@^2.4.3
npx --yes xlsx@^0.18.5
npx --yes react-hot-toast@^2.4.1
npx --yes twilio@^5.3.3

# Then generate Prisma
npx prisma generate

# Push schema
npx prisma db push
```

### Option 3: Reinstall Node.js/npm

If the above doesn't work, reinstall Node.js:

```bash
# If using nvm:
nvm uninstall 18.20.7
nvm install 18.20.7
nvm use 18.20.7

# Or reinstall nvm:
# Follow instructions at https://github.com/nvm-sh/nvm
```

### Option 4: Use Yarn Instead

Install Yarn and use it instead of npm:

```bash
# Install Yarn
npm install -g yarn

# Then use yarn
cd "/Users/akhil/Desktop/Restaurant app"
yarn install
yarn db:generate
yarn db:push
```

## After Fixing npm

Once npm works, run these commands:

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# 1. Create .env file (copy from .env.template)
cp .env.template .env
# Then edit .env and add your Supabase password

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npm run db:generate

# 4. Push database schema
npm run db:push
```

## Verify npm is Working

Test if npm is working:

```bash
npm --version
node --version
```

If both show version numbers, npm is working!

## Still Having Issues?

1. **Check file permissions:**
   ```bash
   ls -la ~/.nvm/versions/node/v18.20.7/lib/node_modules/npm/
   ```

2. **Try with sudo (not recommended, but works):**
   ```bash
   sudo npm install
   ```

3. **Use a different Node.js version:**
   ```bash
   nvm install 20
   nvm use 20
   npm install
   ```

4. **Check if you have multiple Node.js installations:**
   ```bash
   which node
   which npm
   ```

