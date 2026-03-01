# Phase 1: Google OAuth Fix Instructions

## Problem
Google OAuth is using implicit flow (tokens in URL hash) instead of PKCE flow (code exchange).

## Fix in Supabase Dashboard

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Auth Flow Configuration**
4. Change **Flow Type** from "Implicit" to **"PKCE"**
5. Click **Save**

## Verify Settings

**Authentication → URL Configuration:**
- Site URL: `https://accio-ai.vercel.app`
- Redirect URLs: 
  - `https://accio-ai.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

**Authentication → Providers → Google:**
- ✅ Enabled
- Client ID: (your Google OAuth client ID)
- Client Secret: (your Google OAuth client secret)

**Google Cloud Console:**
- Authorized redirect URIs: `https://ajgijfsbguegioggtapx.supabase.co/auth/v1/callback`

## After Changing to PKCE

The OAuth flow will work like this:
1. User clicks "Sign in with Google"
2. Redirects to Google
3. Google redirects back to Supabase with `code` parameter
4. Supabase redirects to `/auth/callback?code=...`
5. Our callback route exchanges code for session
6. User is authenticated ✅

## If PKCE Option Not Available

If you don't see PKCE option in Supabase settings, it means your Supabase version might be older. In that case:

1. The implicit flow will continue to work
2. We need to handle it client-side
3. Keep the current code as-is

## Test After Fix

1. Deploy the code changes
2. Change Supabase to PKCE flow
3. Try Google sign in
4. Should redirect properly and set session
