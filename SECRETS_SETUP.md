# AeonRFP Secrets Setup Guide

## Required Secrets for Full Functionality

### 1. SESSION_SECRET
**Purpose**: Encrypts user sessions for security
**How to get**: Generate a random string at least 32 characters long

**Options**:
- Use this random string: `aeonrfp-super-secure-session-key-2025-change-me-in-production`
- Or generate your own at: https://generate-secret.vercel.app/32

**Add to Replit Secrets**:
```
Key: SESSION_SECRET
Value: aeonrfp-super-secure-session-key-2025-change-me-in-production
```

### 2. ISSUER_URL
**Purpose**: OpenID Connect authentication with Replit
**How to get**: Use the standard Replit authentication endpoint

**Add to Replit Secrets**:
```
Key: ISSUER_URL
Value: https://replit.com
```

## Already Configured
- ✅ DATABASE_URL (PostgreSQL database)
- ✅ REPLIT_DOMAINS (your repl domain)

## Optional Secrets (for enhanced features)
- OPENAI_API_KEY - For AI proposal generation
- GOOGLE_AI_API_KEY - Alternative AI service
- RESEND_API_KEY - For email notifications
- GOOGLE_CLIENT_ID/SECRET - Gmail integration
- SLACK_CLIENT_ID/SECRET - Slack integration

## Quick Setup Steps

1. Click on the "Secrets" tab in Replit (🔒 icon in the left sidebar)
2. Add these two secrets:
   - SESSION_SECRET: `aeonrfp-super-secure-session-key-2025-change-me-in-production`
   - ISSUER_URL: `https://replit.com`
3. The application will automatically restart and work properly

## Fallback Mode
The application is designed to work even without these secrets using:
- In-memory session storage (sessions won't persist between restarts)
- Mock authentication for development
- Simplified database operations

Your app will be fully functional once these secrets are added!