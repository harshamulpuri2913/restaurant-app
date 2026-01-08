# GitHub Push Issue - Troubleshooting

## The Problem

You're getting a **403 Permission Denied** error when trying to push. This usually means:

1. **Token doesn't have correct permissions** - The personal access token might not have `repo` scope
2. **Token expired or invalid** - The token might have been revoked or expired
3. **Repository permissions** - You might not have write access to the repository
4. **Token format issue** - The way we're using the token might be incorrect

## Solutions

### Solution 1: Verify Token Permissions

1. Go to: https://github.com/settings/tokens
2. Find your token (or create a new one)
3. Make sure it has these scopes checked:
   - ✅ **repo** (Full control of private repositories)
   - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`

### Solution 2: Create a New Token (Recommended)

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: "Restaurant App Push"
4. Expiration: Choose 90 days or No expiration
5. **Select scopes**: Check **repo** (this selects all repo permissions)
6. Click **Generate token**
7. **Copy the new token**

### Solution 3: Use Token Interactively

Instead of embedding the token in the URL, use it when prompted:

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Reset remote to normal URL
git remote set-url origin https://github.com/AkhiChalasani/restaurant.git

# Push (will prompt for credentials)
git push -u origin main
```

When prompted:
- **Username**: `AkhiChalasani`
- **Password**: Paste your personal access token (NOT your GitHub password)

### Solution 4: Use SSH Instead (Most Secure)

If you have SSH keys set up with GitHub:

```bash
cd "/Users/akhil/Desktop/Restaurant app"

# Change to SSH URL
git remote set-url origin git@github.com:AkhiChalasani/restaurant.git

# Push
git push -u origin main
```

### Solution 5: Use GitHub CLI

Install GitHub CLI and authenticate:

```bash
# Install GitHub CLI (if not installed)
brew install gh

# Authenticate
gh auth login

# Push
git push -u origin main
```

## Quick Test

Test if your token works:

```bash
curl -H "Authorization: token YOUR_TOKEN_HERE" https://api.github.com/user
```

Replace `YOUR_TOKEN_HERE` with your token. If it returns your user info, the token is valid.

## Most Likely Issue

The token probably doesn't have the `repo` scope. Create a new token with full `repo` permissions and try again.

## After Fixing

Once you have a token with correct permissions:

```bash
cd "/Users/akhil/Desktop/Restaurant app"
git remote set-url origin https://github.com/AkhiChalasani/restaurant.git
git push -u origin main
```

Enter your username and the new token when prompted.

