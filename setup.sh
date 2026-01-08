#!/bin/bash

# Restaurant App Setup Script
# Run this script to set up the database connection

echo "🚀 Setting up Restaurant App..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Please create a .env file with your DATABASE_URL first."
    echo "See SUPABASE_SETUP.md for instructions."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

# Push database schema
echo ""
echo "🗄️  Pushing database schema..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    echo "Please check your DATABASE_URL in .env file"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the server: npm run dev"
echo "2. Seed the database: Visit http://localhost:3000/api/seed"
echo "3. Sign in with admin credentials"

