#!/bin/bash

# Vercel Deployment Script for Scanned Data Organizer
# This script will guide you through deploying to Vercel

set -e

echo "🚀 Scanned Data Organizer - Vercel Deployment Script"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found. Please ensure environment variables are set."
    exit 1
fi

echo "✅ Environment variables file found"
echo ""

# Run a final build test
echo "� Running final build test..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix any errors before deploying."
    exit 1
fi

echo ""
echo "🌟 Ready to deploy to Vercel!"
echo ""
echo "📋 DEPLOYMENT OPTIONS:"
echo ""
echo "Option 1: Manual Deployment (Recommended)"
echo "========================================="
echo "1. Go to https://vercel.com and sign in with GitHub"
echo "2. Click 'Add New Project'"
echo "3. Import your 'Scanned-Data-Organizer' repository"
echo "4. Add these environment variables:"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_URL=https://blwlzzcrxoxngxoccbij.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4"
echo "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE"
echo "   ADMIN_SETUP_PASSWORD=admin123secure"
echo ""
echo "5. Click Deploy and wait for completion!"
echo ""
echo "� For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
echo "✨ Your app will be live at: https://your-project-name.vercel.app"
