# 🚀 Simplified Vercel Deployment Guide

## Option 1: Deploy via Vercel Web Interface (Recommended)

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click "Import Project" or "New Project"
3. Connect your GitHub repository: `brianmwenda/Scanned-Data-Organizer`

### Step 2: Configure Project Settings
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: `./` (keep default)
3. **Build Command**: `npm run build` (should auto-detect)
4. **Output Directory**: `.next` (should auto-detect)

### Step 3: Add Environment Variables
In the deployment configuration, add these environment variables:

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL = https://blwlzzcrxoxngxoccbij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE
ADMIN_SETUP_PASSWORD = admin123secure
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Visit your deployed URL

---

## Option 2: CLI Deployment (Alternative)

If you want to continue with CLI, try this simpler approach:

### Create a new project manually:
```bash
# Initialize a new Vercel project
vercel link

# Add environment variables one by one
echo "https://blwlzzcrxoxngxoccbij.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "admin123secure" | vercel env add ADMIN_SETUP_PASSWORD production

# Deploy
vercel --prod
```

---

## Recommendation

**Use Option 1 (Web Interface)** - it's more reliable and easier to troubleshoot. The CLI sometimes has issues with project setup.

## After Deployment

1. ✅ Visit your deployed URL
2. ✅ Test login functionality
3. ✅ Verify compliance features work
4. ✅ Check API endpoints
5. ✅ Test document upload (if needed)

Your Scanned Data Organizer will be live with all compliance management features!
