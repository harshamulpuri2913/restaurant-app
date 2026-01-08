# SSH Setup for GitHub

## ✅ Step 1: SSH Key Generated

Your SSH key has been generated and copied to clipboard:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF9OF+WxX0ZkHhFJdppq04x22ziBDAGvDTcu2zs/0E8x chalasaniakhil010@gmail.com
```

## Step 2: Add SSH Key to GitHub

1. Go to: https://github.com/settings/keys
2. Click **New SSH key**
3. **Title**: "Mac - Restaurant App" (or any name)
4. **Key type**: Authentication Key
5. **Key**: Paste the key from your clipboard (Cmd+V)
6. Click **Add SSH key**
7. You may be prompted to enter your GitHub password

## Step 3: Test SSH Connection

Run this command to test:

```bash
ssh -T git@github.com
```

You should see:
```
Hi AkhiChalasani! You've successfully authenticated, but GitHub does not provide shell access.
```

## Step 4: Update Git Remote to Use SSH

```bash
cd "/Users/akhil/Desktop/Restaurant app"
git remote set-url origin git@github.com:AkhiChalasani/restaurant.git
```

## Step 5: Push to GitHub

```bash
git push -u origin main
```

This should work without any password prompts!

## Your SSH Key Location

- **Private key**: `~/.ssh/id_ed25519_github` (keep this secret!)
- **Public key**: `~/.ssh/id_ed25519_github.pub` (this is what you add to GitHub)

## Troubleshooting

If SSH doesn't work:

1. **Start SSH agent:**
   ```bash
   eval "$(ssh-agent -s)"
   ```

2. **Add key to SSH agent:**
   ```bash
   ssh-add ~/.ssh/id_ed25519_github
   ```

3. **Test again:**
   ```bash
   ssh -T git@github.com
   ```

## After Setup

Once SSH is working, you can push/pull without entering credentials every time!

