
# AeonRFP Offline Development Setup

## Quick Start for Development

This project now includes a `.env` file with development defaults that will work across all clones. No need to set up Replit Secrets for basic functionality.

## Getting Your API Keys

### 1. Resend Email Service (Required for OTP login)
1. Go to [resend.com](https://resend.com) and sign up
2. Get your API key (starts with `re_`)
3. Replace `re_your_resend_api_key_here` in `.env`

### 2. OpenAI API (Required for AI features)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Get your API key (starts with `sk-`)
3. Replace `sk_your_openai_api_key_here` in `.env`

### 3. Gmail Integration (Optional)
1. Follow the OAuth setup guide in `OAUTH_SETUP.md`
2. Replace the Google credentials in `.env`

### 4. Slack Integration (Optional)
1. Follow the OAuth setup guide in `OAUTH_SETUP.md` 
2. Replace the Slack credentials in `.env`

## How It Works

- ✅ **Database**: Auto-provisioned by Replit
- ✅ **Sessions**: Uses development secret (secure in production)
- ✅ **Environment**: `.env` file is now tracked in git
- ✅ **Cloning**: Works immediately after clone
- ✅ **Development**: All defaults work for development

## Production Deployment

When deploying to production, you can still use Replit Secrets to override the `.env` values for enhanced security.

## Benefits

- 🔄 **Instant Setup**: Clone and run immediately
- 🔧 **Development Ready**: All basic features work
- 🔐 **Flexible**: Can still use Secrets for production
- 📋 **Clear Guidance**: Obvious what needs real API keys
