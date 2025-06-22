#!/bin/bash

# Deployment script for Scanned Data Organizer to Vercel
echo "🚀 Starting deployment to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not found. Please initialize git first."
    exit 1
fi

# Clean up the repository
echo "🧹 Cleaning up repository..."

# Add all new files
echo "📦 Adding new files to git..."
git add .

# Check git status
echo "📊 Current git status:"
git status --short

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (default: 'Deploy compliance management system'): " commit_msg
commit_msg=${commit_msg:-"Deploy compliance management system"}
git commit -m "$commit_msg"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "🌐 Next steps for Vercel deployment:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository: mwendaB/Scanned-Data-Organizer"
echo "4. Configure environment variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "5. Deploy!"
echo ""
echo "📋 Your environment variables should be set to the same values from your .env.local file"
