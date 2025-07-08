# EMERGENCY OAuth 2.0 Fix for Published App

## CRITICAL: Your Published Domain Changed

When you published your app, Replit assigned a new domain. Google OAuth requires EXACT redirect URI matching.

## Get Your Current Published Domain

1. Check your current domain from the environment:
   ```bash
   echo $REPLIT_DOMAINS
   ```

2. Or check the browser URL when accessing your published app

## IMMEDIATE FIX STEPS

### Step 1: Update Google Cloud Console (CRITICAL)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. In "Authorized redirect URIs", REPLACE the old URI with your NEW published domain:

   **Format**: `https://YOUR-NEW-PUBLISHED-DOMAIN.replit.app/api/auth/google/callback`

   **Example**: If your published domain is `aeonrfp-production.yourname.repl.co`, then add:
   ```
   https://aeonrfp-production.yourname.repl.co/api/auth/google/callback
   ```

### Step 2: Verify OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Ensure these scopes are present:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

3. Add your email as a test user if not already added

### Step 3: Additional Compliance Requirements

1. **App Domain Verification**:
   - In OAuth consent screen, add your published domain to "Authorized domains"
   - Format: `yourname.repl.co` (without https://)

2. **Privacy Policy & Terms** (if required):
   - Add Privacy Policy URL
   - Add Terms of Service URL

### Step 4: Test the Integration

1. Save all changes in Google Cloud Console
2. Wait 2-3 minutes for changes to propagate
3. Clear browser cache/cookies
4. Try Gmail connection again

## Why This Happened

1. **Domain Change**: Published apps get different domains than development
2. **HTTPS Requirement**: Published apps use HTTPS, not HTTP
3. **Strict Matching**: Google requires EXACT URI matching for security

## Advanced Debugging

If still getting errors, check:

1. **Exact Domain Match**: Copy-paste your exact published domain
2. **Protocol**: Must be `https://` for published apps
3. **Path**: Must end with `/api/auth/google/callback`
4. **No Trailing Slash**: Don't add extra `/` at the end

## Backup Solution

If OAuth continues failing:
1. The app works perfectly without OAuth integrations
2. Gmail/Slack will show "Not Configured" but won't break functionality
3. Focus on core RFP features first, add OAuth later

## Prevention for Future

1. **Use Custom Domain**: Consider using a custom domain that won't change
2. **Multiple URIs**: Add both development and production URIs
3. **Environment Detection**: Use environment variables to handle different domains