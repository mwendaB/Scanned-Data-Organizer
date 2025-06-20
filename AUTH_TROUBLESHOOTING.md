# 🔧 Authentication Troubleshooting Guide

## The "OTP Expired" Error Explained

The error you're seeing:
```
http://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

This happens when:
1. **Email link expired** - Supabase email confirmation links expire after 24 hours
2. **Link already used** - Each confirmation link can only be used once
3. **Incorrect redirect URL** - The callback URL doesn't match your app configuration

## ✅ Immediate Solutions

### Solution 1: Check Your Supabase Configuration

1. **Go to your Supabase dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Verify your Site URL is set to:** `http://localhost:3000`
4. **Add to Redirect URLs:** `http://localhost:3000/auth/callback`

### Solution 2: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Solution 3: Clear Browser Data

1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear Local Storage for localhost:3000
4. Clear Cookies for localhost:3000
5. Refresh the page

### Solution 4: Generate a New Confirmation Email

1. **Go to your app:** http://localhost:3000
2. **Try to sign up again** with the same email
3. **Check your email** for a new confirmation link
4. **Click the new link immediately** (don't wait)

## 🔍 Verification Steps

### Check 1: Supabase Dashboard Settings
```
Dashboard > Authentication > URL Configuration
- Site URL: http://localhost:3000
- Redirect URLs: http://localhost:3000/auth/callback
```

### Check 2: Environment Variables
Verify your `.env` file has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Check 3: Auth Callback Route
The file `src/app/auth/callback/route.ts` should exist and handle the callback.

## 🚀 Quick Test Flow

1. **Start fresh:**
   ```bash
   npm run dev
   ```

2. **Open browser in incognito mode**

3. **Go to:** http://localhost:3000

4. **Sign up with a new email or retry with existing email**

5. **Check email immediately and click the confirmation link**

6. **You should be redirected to the dashboard**

## 🐛 Still Having Issues?

### Debug Mode
Add this to your `.env` file to see detailed auth logs:
```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

### Check Browser Console
1. Open developer tools (F12)
2. Look for any error messages
3. Check Network tab for failed requests

### Alternative: Direct Sign-In
If email confirmation keeps failing:
1. Go to your Supabase dashboard
2. Authentication > Users
3. Find your user and manually confirm their email
4. Then try signing in directly with email/password

## 🔄 Reset Everything

If nothing works, completely reset:

```bash
# 1. Stop the server
# 2. Clear browser data
# 3. Delete any test users from Supabase dashboard
# 4. Restart server
npm run dev
# 5. Create new account with different email
```

## 💡 Prevention Tips

1. **Click email links immediately** - Don't wait hours
2. **Use incognito mode** for testing to avoid cache issues
3. **Check spam folder** - Confirmation emails might be filtered
4. **Use a real email** - Some temporary email services cause issues
5. **Keep the app tab open** while checking email

## 📧 Email Provider Issues

Some email providers (Gmail, Yahoo) may delay or block Supabase emails:
- **Check spam/promotions folder**
- **Add Supabase to your contacts**
- **Try a different email provider** for testing

The auth callback route has been updated to handle these errors better and provide clearer feedback to users.
