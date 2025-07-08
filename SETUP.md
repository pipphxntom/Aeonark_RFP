# AeonRFP Setup Guide

## Quick Start

1. **Clone this project** to your Replit workspace
2. **Set up environment variables** in Replit Secrets:
   - `RESEND_API_KEY` - Get from [resend.com](https://resend.com)
   - `OPENAI_API_KEY` - Get from [platform.openai.com](https://platform.openai.com)
   - `SESSION_SECRET` - Any secure random string
3. **Run the application** - The "Start application" workflow will automatically start

## Environment Variables

All environment variables are stored in **Replit Secrets** and persist across project clones:

### Required Variables
- `DATABASE_URL` - Automatically configured by Replit PostgreSQL
- `RESEND_API_KEY` - Email service for OTP authentication
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

The OTP email system uses Resend:
1. Sign up at [resend.com](https://resend.com)
2. Generate an API key
3. Add it to Replit Secrets as `RESEND_API_KEY`
4. Email functionality will work automatically

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