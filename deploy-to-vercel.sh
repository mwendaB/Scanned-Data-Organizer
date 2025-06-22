#!/bin/bash

# Deploy to Vercel with Environment Variables
# This script helps you deploy your Scanned Data Organizer to Vercel

echo "🚀 Deploying Scanned Data Organizer to Vercel"
echo "=============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Set environment variables in Vercel
echo "🔧 Setting up environment variables..."

# Production environment variables
echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo "Setting ADMIN_SETUP_PASSWORD..."
vercel env add ADMIN_SETUP_PASSWORD production

# Preview environment variables (optional)
echo "Setting up preview environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add ADMIN_SETUP_PASSWORD preview

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit your Vercel dashboard to verify deployment"
echo "2. Test your application functionality"
echo "3. Set up custom domain if needed"
