#!/bin/bash

# Commands to set environment variables in Vercel
# Run these one by one in your terminal

echo "🔧 Setting up Vercel environment variables..."
echo ""
echo "Run these commands one by one:"
echo ""

echo "1. Set NEXT_PUBLIC_SUPABASE_URL:"
echo "vercel env add NEXT_PUBLIC_SUPABASE_URL"
echo "When prompted, enter: https://blwlzzcrxoxngxoccbij.supabase.co"
echo "Select environments: Production, Preview, Development"
echo ""

echo "2. Set NEXT_PUBLIC_SUPABASE_ANON_KEY:"
echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4"
echo "Select environments: Production, Preview, Development"
echo ""

echo "3. Set SUPABASE_SERVICE_ROLE_KEY:"
echo "vercel env add SUPABASE_SERVICE_ROLE_KEY"
echo "When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE"
echo "Select environments: Production, Preview, Development"
echo ""

echo "4. Set ADMIN_SETUP_PASSWORD:"
echo "vercel env add ADMIN_SETUP_PASSWORD"
echo "When prompted, enter: admin123secure"
echo "Select environments: Production, Preview, Development"
echo ""

echo "After setting all variables, redeploy with:"
echo "vercel --prod"
