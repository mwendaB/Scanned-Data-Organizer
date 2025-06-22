#!/bin/bash

echo "🚀 Starting Scanned Data Organizer..."
echo "📍 Working directory: $(pwd)"
echo "🔧 Checking Node.js version: $(node --version)"
echo "📦 Checking npm version: $(npm --version)"

echo ""
echo "🔑 Environment variables status:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    echo "✅ NEXT_PUBLIC_SUPABASE_URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | head -c 50)..."
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2 | head -c 20)..."
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "🏃‍♂️ Starting Next.js development server..."
npm run dev
