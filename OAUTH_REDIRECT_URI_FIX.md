# OAUTH REDIRECT URI MISMATCH - CRITICAL FIX

## Current Status
The application is generating this redirect URI:
```
https://a3239ce2-f562-4af6-a163-86d23abb48ae-00-4rjrf5nj88zz.kirk.replit.dev/api/auth/google/callback
```

## The Problem
Google OAuth is rejecting the request with "redirect_uri_mismatch" error because the redirect URI in Google Cloud Console doesn't match what the application is sending.

## IMMEDIATE SOLUTION REQUIRED

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID (starts with 648482015550...)

### Step 2: Update Authorized Redirect URIs
In the OAuth client configuration, ensure EXACTLY this URI is listed:
```
https://a3239ce2-f562-4af6-a163-86d23abb48ae-00-4rjrf5nj88zz.kirk.replit.dev/api/auth/google/callback
```

### Step 3: Remove Any Other URIs
If there are any other redirect URIs listed (like localhost or different domains), remove them or ensure they don't conflict.

### Step 4: Save and Wait
- Click "Save"
- Wait 2-3 minutes for Google's servers to update
- Try the Gmail connection again

## Why This Happens
- Replit generates dynamic domains for each deployment
- The redirect URI must EXACTLY match between Google Cloud Console and the application
- Even a single character difference (http vs https, trailing slash, etc.) will cause this error

## Verification
After updating Google Cloud Console, the Gmail integration should work immediately. The error will disappear and you'll be able to connect to Gmail successfully.