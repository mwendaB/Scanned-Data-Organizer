# Vercel Environment Variables Setup

## Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Add Environment Variables:**
   ```bash
   # Production environment
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # When prompted, enter: https://blwlzzcrxoxngxoccbij.supabase.co
   
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   # When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4
   
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE
   
   vercel env add ADMIN_SETUP_PASSWORD production
   # When prompted, enter: admin123secure
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

## Method 2: Via Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings:**
   - Click on "Settings" tab
   - Click on "Environment Variables"

3. **Add Variables:**
   
   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://blwlzzcrxoxngxoccbij.supabase.co`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDE1NzQsImV4cCI6MjA2NTk3NzU3NH0.KYlsMfFVdIlly3NdnAnH5mSwi80niyEy0vKY4ChXAm4`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2x6emNyeG94bmd4b2NjYmlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQwMTU3NCwiZXhwIjoyMDY1OTc3NTc0fQ.OWxznhLlJE0L1W8BHLLe3NYtdOuk5WcepOv5S_G9nEE`
   - Environments: ✅ Production ✅ Preview

   **Variable 4:**
   - Name: `ADMIN_SETUP_PASSWORD`
   - Value: `admin123secure`
   - Environments: ✅ Production ✅ Preview

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment

## Method 3: Automated Script

Run the provided script:
```bash
./deploy-to-vercel.sh
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files to git**
2. **SUPABASE_SERVICE_ROLE_KEY should only be in Production/Preview, not Development**
3. **Change ADMIN_SETUP_PASSWORD to something more secure**
4. **Use different values for Preview and Production if needed**

## Verification

After deployment, verify environment variables are working:
1. Check Vercel deployment logs
2. Test API endpoints
3. Verify Supabase connection
4. Test compliance management features
