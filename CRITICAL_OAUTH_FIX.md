# CRITICAL OAuth Fix - "invalid_client" Error

## 🚨 IMMEDIATE ACTION REQUIRED

The "invalid_client" error indicates one of these critical issues:

### 1. WRONG CLIENT ID FORMAT
**Most Common Issue**: Your GOOGLE_CLIENT_ID doesn't have the correct format.

**Valid format**: `123456789-abcdefg.apps.googleusercontent.com`
**Invalid format**: `AIzaSyABC123...` (This is an API key, not Client ID)

### 2. MISMATCHED REDIRECT URI
**Required URI**: `https://6a870730-096e-4a82-b7d1-be765b6984d9-00-2fq7ybmcqiyux.janeway.replit.dev/api/auth/google/callback`

## 🔧 STEP-BY-STEP FIX

### Step 1: Verify Client ID Format
1. Check your current GOOGLE_CLIENT_ID in Replit Secrets
2. It MUST end with `.apps.googleusercontent.com`
3. If it doesn't, you have an API key instead of OAuth Client ID

### Step 2: Create Correct OAuth Client (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click "CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
4. Application type: **Web application**
5. Name: "AeonRFP Gmail Integration"
6. Authorized redirect URIs: Add this EXACT URI:
   ```
   https://6a870730-096e-4a82-b7d1-be765b6984d9-00-2fq7ybmcqiyux.janeway.replit.dev/api/auth/google/callback
   ```
7. Click "CREATE"
8. Copy the Client ID (ends with .apps.googleusercontent.com)
9. Copy the Client Secret

### Step 3: Update Replit Secrets
1. Go to Replit Secrets tab
2. Update `GOOGLE_CLIENT_ID` with the new Client ID
3. Update `GOOGLE_CLIENT_SECRET` with the new Client Secret

### Step 4: Enable Gmail API
1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "ENABLE"

### Step 5: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "AeonRFP"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `../auth/gmail.readonly`
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

## 🔍 DEBUGGING

Run this to check your configuration:
```bash
node oauth-debug.js
```

## ⚡ COMMON MISTAKES

1. **Using API Key instead of Client ID**: API keys start with `AIzaSy...`
2. **Wrong redirect URI**: Must be EXACT match
3. **HTTP instead of HTTPS**: Must use HTTPS for production
4. **Missing Gmail API**: API must be enabled
5. **Incomplete OAuth consent screen**: Required for external users

## 🎯 SUCCESS INDICATORS

After fixing:
- No "invalid_client" error
- OAuth popup opens correctly
- Can authorize Gmail access
- Redirects back to application
- Shows connected status

This should resolve the OAuth issue permanently.