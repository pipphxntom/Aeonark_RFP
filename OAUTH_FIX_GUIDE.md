# Fix for Google OAuth 2.0 Error 400: invalid_request

## The Problem
You're getting "Error 400: invalid_request" because your Google Cloud Console redirect URI doesn't match your actual Replit domain.

## Your Current Domain
Based on the system, your current Replit domain is:
```
https://60e9e6fe-47eb-4c15-8bf9-5e2cce3314a9-00-1g5hlcuoey663.picard.replit.dev
```

## The Fix

### Step 1: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. In "Authorized redirect URIs", add EXACTLY:
   ```
   https://60e9e6fe-47eb-4c15-8bf9-5e2cce3314a9-00-1g5hlcuoey663.picard.replit.dev/api/auth/google/callback
   ```

### Step 2: Verify OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Ensure these scopes are added:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Add your email as a test user

### Step 3: Test the Connection
1. Save the changes in Google Cloud Console
2. Restart your Replit application
3. Try the Gmail connection again

## Important Notes
- The redirect URI must match EXACTLY - no typos or extra characters
- Use `https://` for Replit domains, not `http://`
- If you clone this project, the domain will change and you'll need to update the redirect URI again

## Alternative for Development
If you prefer not to update Google Cloud Console for each clone, you can:
1. Use the development fallback mode (current setup)
2. Set up OAuth only when ready for production
3. The integrations will show "Not Configured" but the app works normally