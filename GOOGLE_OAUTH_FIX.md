# Google OAuth "invalid_client" Error Fix

## Problem
Getting "Access blocked: authorization error - The OAuth client was not found - Error 401: invalid_client" when trying to connect Gmail integration.

## Root Cause
The redirect URI configured in Google Cloud Console doesn't match the redirect URI being used by the application.

## Solution

### Step 1: Your Current Redirect URI
Your application is using this exact redirect URI:
```
https://6a870730-096e-4a82-b7d1-be765b6984d9-00-2fq7ybmcqiyux.janeway.replit.dev/api/auth/google/callback
```

### Step 2: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Navigate to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID or create a new one
5. Click "Edit" on your OAuth client
6. In "Authorized redirect URIs", add this exact URI:
   ```
   https://6a870730-096e-4a82-b7d1-be765b6984d9-00-2fq7ybmcqiyux.janeway.replit.dev/api/auth/google/callback
   ```

### Step 3: Enable Required APIs
Make sure these APIs are enabled in your Google Cloud project:
- Gmail API
- Google+ API (for user info)

### Step 4: Verify Credentials
Ensure your Replit Secrets contain:
- `GOOGLE_CLIENT_ID`: Your OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET`: Your OAuth 2.0 Client Secret

### Step 5: Test the Integration
Restart your application and try the Gmail integration again.

## Common Issues

### Multiple Redirect URIs
If you need to support multiple environments, add all possible redirect URIs to Google Cloud Console:
```
http://localhost:5000/api/auth/google/callback
https://your-app.replit.app/api/auth/google/callback
https://your-custom-domain.com/api/auth/google/callback
```

### Domain Verification
For production apps, you may need to verify domain ownership in Google Cloud Console.

### Scope Permissions
The app requests these scopes:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

Make sure your OAuth consent screen is configured to request these scopes.

## Testing
After fixing the redirect URI, the Gmail integration should work without the "invalid_client" error.