# Fix for "Invalid domain: must be a top private domain" Error

## The Problem
Google Cloud Console is rejecting `picard.replit.dev` because it's not a domain you own - it belongs to Replit.

## CORRECTED SOLUTION

### Step 1: ONLY Update Redirect URI (This is enough!)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"  
3. Click your OAuth 2.0 Client ID
4. In "Authorized redirect URIs", add EXACTLY:
   ```
   https://60e9e6fe-47eb-4c15-8bf9-5e2cce3314a9-00-1g5hlcuoey663.picard.replit.dev/api/auth/google/callback
   ```

### Step 2: SKIP Authorized Domains
**IMPORTANT**: Do NOT add any authorized domains. Leave this section empty.

For Replit-hosted apps, you cannot add the domain because:
- You don't own `picard.replit.dev` (Replit does)
- Google requires domain ownership verification
- The redirect URI is sufficient for OAuth to work

### Step 3: Verify OAuth Consent Screen Settings
1. In "OAuth consent screen", ensure these scopes are present:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
2. Add your email as a test user
3. Leave "Authorized domains" EMPTY

### Step 4: Test
1. Save changes in Google Cloud Console
2. Wait 2-3 minutes for propagation
3. Clear browser cache
4. Try Gmail connection again

## Why This Works
- OAuth only requires the exact redirect URI to match
- Authorized domains are optional for most OAuth flows
- The redirect URI verification is the primary security check

## Alternative Solution (If still failing)
If you continue having issues, consider:
1. Using a custom domain you own
2. Setting up a reverse proxy
3. Using the development mode (integrations show "Not Configured")

The app works perfectly without OAuth integrations - they're optional features.