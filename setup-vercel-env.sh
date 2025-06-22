#!/bin/bash

# Automatic Environment Variable Setup for Vercel
# This script reads your .env.local file and sets up variables in Vercel

echo "🔧 Setting up environment variables in Vercel..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your environment variables first."
    exit 1
fi

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Read environment variables from .env.local
source .env.local

echo "📋 Found the following environment variables:"
echo "- NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."
echo "- SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
echo "- ADMIN_SETUP_PASSWORD: ***"

echo ""
echo "🚀 Setting up variables in Vercel..."

# Function to add environment variable
add_env_var() {
    local name=$1
    local value=$2
    local env=$3
    
    echo "Adding $name to $env environment..."
    echo "$value" | vercel env add "$name" "$env" --force
}

# Add variables to production
echo "Setting up Production environment..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "production"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "production"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"
add_env_var "ADMIN_SETUP_PASSWORD" "$ADMIN_SETUP_PASSWORD" "production"

# Add variables to preview
echo "Setting up Preview environment..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "preview"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "preview"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "preview"
add_env_var "ADMIN_SETUP_PASSWORD" "$ADMIN_SETUP_PASSWORD" "preview"

echo ""
echo "✅ Environment variables have been set up in Vercel!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'vercel --prod' to deploy to production"
echo "2. Or run 'vercel' to deploy to preview"
echo "3. Check your Vercel dashboard to verify the variables"
