# AeonRFP Setup Guide

## Quick Start

1. **Clone this project** to your Replit workspace
2. **Set up environment variables** in Replit Secrets:
   - `TITAN_MAIL_PASSWORD` - Password for noreply@aeonark.tech account
   - `OPENAI_API_KEY` - Get from [platform.openai.com](https://platform.openai.com)
   - `SESSION_SECRET` - Any secure random string
3. **Run the application** - The "Start application" workflow will automatically start

## Environment Variables

All environment variables are stored in **Replit Secrets** and persist across project clones:

### Required Variables
- `DATABASE_URL` - Automatically configured by Replit PostgreSQL
- `TITAN_MAIL_PASSWORD` - Titan Mail SMTP for OTP authentication
- `OPENAI_API_KEY` - AI-powered proposal generation
- `SESSION_SECRET` - Secure session management

### Optional Variables
- `ISSUER_URL` - OAuth configuration (defaults to Replit)
- `REPLIT_DOMAINS` - Allowed domains for OAuth

## Database Setup

The database is automatically configured when you run the application:
- PostgreSQL database is provisioned automatically
- Database migrations run on startup
- No manual setup required

## Email Service

The OTP email system uses Titan Mail SMTP:
1. Use your noreply@aeonark.tech account credentials
2. Add the password to Replit Secrets as `TITAN_MAIL_PASSWORD`
3. Add the email as `TITAN_MAIL_USER` (defaults to noreply@aeonark.tech)
4. Email functionality will work automatically

## OAuth Integration (Optional)

Gmail and Slack integrations work automatically in development mode. For production use:

### Gmail Integration
1. Create Google Cloud project and enable Gmail API
2. Set up OAuth 2.0 credentials
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Replit Secrets

### Slack Integration  
1. Create Slack app with OAuth permissions
2. Add redirect URLs for your domain
3. Add `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` to Replit Secrets

**Note**: Without these credentials, integrations show "Not Configured" status but the app works normally.

## Features

- **AI Proposal Generation** - Upload RFPs and generate professional proposals
- **Smart Matching** - AI compatibility analysis for RFPs
- **Analytics Dashboard** - Track proposal performance and win rates
- **OAuth Integration** - Gmail and Slack integrations for monitoring
- **Memory Engine** - Reusable clauses from successful proposals

## Troubleshooting

- **Email not working**: Check that `RESEND_API_KEY` is set in Replit Secrets
- **AI features not working**: Verify `OPENAI_API_KEY` is configured
- **Database errors**: Database auto-provisions on first run
- **Session issues**: Ensure `SESSION_SECRET` is a secure random string

## Development

The application runs in development mode with:
- Hot module reloading for frontend changes
- Automatic server restart on backend changes
- Development OTP display when email service is unavailable