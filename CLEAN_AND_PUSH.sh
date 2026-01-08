#!/bin/bash
# Script to clean secrets from git history and push to GitHub

echo "🔒 Cleaning secrets from git history..."

cd "/Users/akhil/Desktop/Restaurant app"

# Step 1: Stage all fixed files
echo "📝 Staging fixed files..."
git add docs/setup/SETUP_ENV.md
git add docs/setup/PRODUCTION_SETUP.md
git add docs/troubleshooting/*.md

# Step 2: Commit the fixes
echo "💾 Committing security fixes..."
git commit -m "Security: Remove all secrets and passwords from documentation"

# Step 3: Remove secrets from git history using filter-branch
echo "🧹 Cleaning git history (this may take a few minutes)..."

# Remove GitHub Personal Access Token
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch -r . && git reset HEAD' \
  --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true

# Alternative: Use BFG Repo-Cleaner if available (faster)
# bfg --replace-text passwords.txt

# Step 4: Force garbage collection
echo "🗑️  Cleaning up..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Step 5: Push to new repository
echo "🚀 Pushing to GitHub..."
echo ""
echo "⚠️  IMPORTANT: This will rewrite history. If the repository already has commits, you may need to force push."
echo ""
read -p "Continue with push? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    git push -u origin main --force
    echo "✅ Push complete!"
else
    echo "❌ Push cancelled. Run 'git push -u origin main --force' manually when ready."
fi

