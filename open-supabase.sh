#!/bin/bash

# Quick Supabase setup script
echo "🚀 Opening Supabase Dashboard for Migration..."

# Extract project ID from URL
PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d'=' -f2 | sed 's|https://||' | cut -d'.' -f1)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not find project ID in .env file"
    echo "Please check your NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo "📋 Migration Steps:"
echo "1. Your Supabase SQL Editor will open in your browser"
echo "2. Copy the migration SQL from above"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'RUN' to execute"
echo ""
echo "🔗 Project ID: $PROJECT_ID"
echo "🔗 Opening: https://app.supabase.com/project/$PROJECT_ID/sql"
echo ""

# Try to open the URL in the default browser
if command -v open >/dev/null 2>&1; then
    # macOS
    open "https://app.supabase.com/project/$PROJECT_ID/sql"
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "https://app.supabase.com/project/$PROJECT_ID/sql"
elif command -v start >/dev/null 2>&1; then
    # Windows
    start "https://app.supabase.com/project/$PROJECT_ID/sql"
else
    echo "Please manually open: https://app.supabase.com/project/$PROJECT_ID/sql"
fi

echo ""
echo "✅ After running the migration, configure these URLs in Supabase:"
echo "   Authentication → URL Configuration"
echo "   Site URL: http://localhost:3000"
echo "   Redirect URLs: http://localhost:3000/auth/callback"
echo ""
echo "🎯 Then test with: npm run dev"
