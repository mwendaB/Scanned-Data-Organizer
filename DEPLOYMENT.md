# Scanned Data Organizer - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project set up

### 1. Automated Deployment

Run the deployment script:
```bash
./deploy.sh
```

This will:
- Clean up your git repository
- Commit all changes
- Push to GitHub
- Provide next steps for Vercel

### 2. Manual Deployment Steps

#### Step 1: Push to GitHub
```bash
# Add all files
git add .

# Commit changes
git commit -m "Deploy compliance management system"

# Push to GitHub
git push origin main
```

#### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository: `mwendaB/Scanned-Data-Organizer`
4. Configure the following settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Step 3: Environment Variables
Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

**To get these values:**
1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the Project URL and API Keys

#### Step 4: Deploy
Click **"Deploy"** and wait for the build to complete.

## 🌐 Features Available After Deployment

- ✅ **Document Upload & OCR**: Upload and process scanned documents
- ✅ **Compliance Management**: Full SOX, GDPR, PCAOB, ISO 27001 compliance
- ✅ **User Management**: Role-based access control
- ✅ **Analytics Dashboard**: Document and compliance analytics
- ✅ **Workflow Management**: Document review and approval workflows
- ✅ **Risk Management**: Risk assessment and monitoring
- ✅ **Export Options**: Multiple export formats for data and reports

## 🔧 Post-Deployment Setup

### 1. Database Setup
After deployment, visit your Vercel app and:
1. Navigate to `/db-status`
2. Use the database setup tools to initialize tables
3. Create admin users as needed

### 2. Compliance System
The compliance management system is ready to use:
- Visit `/compliance` for full compliance management
- Use the main dashboard's compliance tab for overview
- Create frameworks, rules, and run compliance checks

### 3. User Management
- Set up user roles and permissions
- Configure department assignments
- Enable collaborative features

## 🛠️ Environment Configuration

### Production Environment Variables
Make sure these are set in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Development
For local development, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📞 Support

If you encounter issues during deployment:
1. Check Vercel build logs for errors
2. Verify environment variables are set correctly
3. Ensure Supabase database is accessible
4. Check that all required dependencies are in package.json

## 🎉 Success!

Once deployed, your Scanned Data Organizer will be available at:
`https://your-project-name.vercel.app`

The system includes a complete compliance management workflow, document processing, and analytics dashboard ready for production use.
