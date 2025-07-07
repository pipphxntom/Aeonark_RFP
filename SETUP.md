
# AeonRFP Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)

## Environment Variables Required

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL="postgresql://username:password@host/database"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Session Security
SESSION_SECRET="your-random-session-secret"

# Replit OAuth (for production)
REPLIT_DOMAINS="your-replit-domain.replit.dev"
ISSUER_URL="https://replit.com"
```

## Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aeonrfp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   - Create a PostgreSQL database (recommend using Neon: https://neon.tech)
   - Add the DATABASE_URL to your .env file
   - Run database migrations:
   ```bash
   npm run db:push
   ```

4. **Configure environment variables**
   - Copy the .env variables listed above
   - Get OpenAI API key from https://platform.openai.com
   - Generate a random SESSION_SECRET (use: `openssl rand -base64 32`)

5. **Start development server**
   ```bash
   npm run dev
   ```

## Replit Deployment

If deploying on Replit:
1. Fork this Repl
2. Provision a PostgreSQL database in Replit
3. Add environment variables in Replit Secrets
4. The app will auto-configure for Replit OAuth

## Common Issues

- **"OAuth discovery failed"**: Normal in development mode, uses mock auth
- **Database connection errors**: Check your DATABASE_URL format
- **Port issues**: App runs on port 5000 by default
