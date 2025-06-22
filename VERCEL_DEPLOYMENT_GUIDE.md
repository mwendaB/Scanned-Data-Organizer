# Vercel Deployment Guide

## Step 1: Manual Deployment via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with your GitHub account
2. **Click "Add New Project"**
3. **Import your repository**: Select your `Scanned-Data-Organizer` repository
4. **Configure Project**: 
   - Framework Preset: Next.js
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (leave as default)
   - Output Directory: `.next` (leave as default)

## Step 2: Add Environment Variables

In the Vercel project settings, add these **exact** environment variables:

### Required Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://blwlzzcrxoxngxoccbij.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE` | Production, Preview, Development |
| `ADMIN_SETUP_PASSWORD` | `admin123secure` | Production, Preview, Development |

## Step 3: Deploy

1. **Click "Deploy"** - Vercel will automatically build and deploy your app
2. **Wait for deployment** to complete (usually 2-5 minutes)
3. **Visit your live app** at the provided URL

## Option 2: CLI Deployment (Alternative)

If you prefer to use the CLI after manual setup:

```bash
# First, complete Steps 1-2 above via the dashboard
# Then you can use CLI for future deployments:

# Login to Vercel (if not already logged in)
vercel login

# Link to your existing project
vercel link

# Deploy to production
vercel --prod
```

## Troubleshooting

### If build fails:
1. Check the build logs in Vercel dashboard
2. Ensure all environment variables are set correctly
3. Make sure your Supabase project is active and accessible

### If the app loads but has errors:
1. Check the Vercel function logs
2. Verify Supabase connection is working
3. Check browser console for client-side errors

### Common Issues:
- **Environment variables not set**: Double-check all 4 variables are added
- **Supabase connection**: Verify your Supabase project URL and keys
- **Build warnings**: These are normal and won't prevent deployment

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Authentication works
- [ ] File upload works
- [ ] Dashboard displays data from Supabase
- [ ] Workflow management functions properly
- [ ] No console errors in browser

## Your Vercel App URLs

After deployment, you'll get:
- **Production URL**: `https://your-app-name.vercel.app`
- **Preview URLs**: For each pull request/branch
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

**Note**: Your environment variables are already production-ready. The Supabase project is live and all API endpoints should work immediately after deployment.
