
# OAuth Integration Setup Guide

## Overview
AeonRFP supports Gmail and Slack integrations for monitoring incoming RFPs and notifications. This guide explains how to set up OAuth credentials permanently across project clones.

## Solving Google OAuth 2.0 Verification Error

If you get "Error 400: invalid_request" with "doesn't comply with Google's OAuth 2.0 policy", follow these steps:

### Option 1: Publish Your OAuth App (Production Ready)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "OAuth consent screen"
3. Complete all required fields:
   - App name: "AeonRFP"
   - User support email: Your email
   - Developer contact information: Your email
   - App domain: Your Replit domain
   - Privacy Policy URL: `https://your-repl-domain/privacy`
   - Terms of Service URL: `https://your-repl-domain/terms`
4. Add all required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Click "Publish App" to move from testing to production
6. Submit for verification if required

### Option 2: Add Test Users (Quick Fix)
1. In "OAuth consent screen", scroll to "Test users"
2. Click "Add Users"
3. Add your email and any other emails that need access
4. Save changes

### Option 3: Use Internal App (Organization Only)
1. In "OAuth consent screen", select "Internal" user type
2. This limits access to your Google Workspace organization
3. No verification required, but only works for your organization

## Gmail Integration Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API and Google+ API

### 2. Create OAuth 2.0 Credentials
1. Navigate to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application" as application type
4. Add your Replit domain to authorized redirect URIs:
   ```
   https://your-repl-name.your-username.repl.co/api/auth/google/callback
   ```

### 3. Add to Replit Secrets
1. In your Replit project, go to "Secrets" (lock icon)
2. Add these environment variables:
   - `GOOGLE_CLIENT_ID`: Your OAuth 2.0 Client ID
   - `GOOGLE_CLIENT_SECRET`: Your OAuth 2.0 Client Secret

## Slack Integration Setup

### 1. Create Slack App
1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Choose app name and workspace

### 2. Configure OAuth Settings
1. In your Slack app settings, go to "OAuth & Permissions"
2. Add redirect URL:
   ```
   https://your-repl-name.your-username.repl.co/api/auth/slack/callback
   ```
3. Add these OAuth scopes:
   - `channels:read` - View channels
   - `files:read` - View file content
   - `chat:write` - Send messages
   - `users:read` - View user info
   - `team:read` - View team info

### 3. Add to Replit Secrets
1. In your Replit project, go to "Secrets" (lock icon)
2. Add these environment variables:
   - `SLACK_CLIENT_ID`: Your Slack App Client ID
   - `SLACK_CLIENT_SECRET`: Your Slack App Client Secret

## Required Environment Variables

### Core OAuth Variables
```bash
# Gmail Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack Integration  
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

### System Variables (Auto-configured)
```bash
# These are automatically set by Replit
DATABASE_URL=postgresql://...
SESSION_SECRET=your_session_secret
RESEND_API_KEY=your_resend_key
OPENAI_API_KEY=your_openai_key
```

## Testing Integration

1. Start your application
2. Navigate to dashboard integrations
3. Click "Connect Gmail" or "Connect Slack"
4. Complete OAuth flow
5. Verify connection status

## Troubleshooting

### Common Issues

**"OAuth not configured" Error**
- Ensure all required environment variables are set in Replit Secrets
- Verify redirect URIs match your Replit domain exactly
- Check that APIs are enabled in Google Cloud Console

**"Invalid redirect URI" Error**
- Update redirect URIs in OAuth provider settings
- Use exact Replit domain (check your current URL)

**"OAuth doesn't comply with Google's OAuth 2.0 policy" Error**
- Follow the publishing steps above
- Add yourself as a test user for immediate access
- Ensure all required OAuth consent screen fields are completed

**"OAuth failed" Error**
- Check server logs for detailed error messages
- Verify OAuth app permissions and scopes
- Ensure secrets are properly set and saved

### Development Mode

When OAuth credentials are not configured:
- Integration buttons show "Not Configured" status
- Clear error messages guide setup process
- Application continues to function without integrations

## Security Notes

- Never commit OAuth credentials to version control
- Use Replit Secrets for all sensitive configuration
- Rotate credentials periodically
- Monitor OAuth app usage in provider dashboards

## Persistence Across Clones

Once OAuth credentials are set in Replit Secrets:
- Variables persist across project clones
- No need to reconfigure for each instance
- Team members can access shared configuration
- Secrets are isolated per Replit project

## Support

If you encounter issues:
1. Check this guide for common solutions
2. Review server logs for error details
3. Verify all required secrets are properly set
4. Test OAuth flows in provider dashboards
