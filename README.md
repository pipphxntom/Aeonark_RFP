# AeonRFP

AI-powered RFP (Request for Proposal) analysis and proposal generation platform with Gmail and Slack integrations.

## Features

- 🤖 **AI-Powered Analysis**: Smart matching of RFPs to your capabilities
- 📝 **Automated Proposal Generation**: Create professional proposals in minutes
- 📊 **Analytics Dashboard**: Track performance, win rates, and ROI
- 🧠 **Memory Engine**: Reuse successful clauses from past proposals
- 🔐 **Secure Authentication**: OTP-based email verification
- 📧 **Email Integration**: Automated notifications and alerts

## Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd aeonrfp
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- **DATABASE_URL**: PostgreSQL connection string
- **GEMINI_API_KEY**: Get from [Google.Gemini](https://platform.openai.com/api-keys)
- **TITAN_MAIL_PASSWORD**: Password for noreply@aeonark.tech Titan Mail account
- **SESSION_SECRET**: Generate a secure random string

### 3. Database Setup
The application will automatically create required tables on first run.

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5000` to access the application.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `GEMINI_API_KEY` | Gemini API key for AI features | ✅ |
| `TITAN_MAIL_PASSWORD` | Password for Titan Mail SMTP | ✅ |
| `SESSION_SECRET` | Secret key for session encryption | ✅ |
| `ISSUER_URL` | OAuth issuer URL (production) | ❌ |

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT models
- **Email**: Titan Mail SMTP service
- **Authentication**: OTP-based email verification

## Development Features

- 🔧 **Hot Module Replacement**: Instant updates during development
- 📋 **Development OTP**: Codes shown in console when email fails
- 🛡️ **Error Handling**: Comprehensive error catching and logging
- 🔍 **Debug Mode**: Detailed logging for troubleshooting

## Deployment

This application can be deployed anywhere that supports Node.js and PostgreSQL.

## Support

For issues or questions, please check the console logs and ensure all environment variables are properly configured.

## Quick Start

1. Clone this repl
2. Set up your environment variables in the Secrets tab:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `RESEND_API_KEY` - Your Resend API key for emails
   - `GEMINI_API_KEY` - Your OpenAI API key
   - `SESSION_SECRET` - A random secret for sessions
3. Run `npm run db:setup` to initialize the database
4. Run the project

## Database Setup

The database will be automatically initialized when you run the project for the first time. If you encounter database issues:

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or run the complete setup
npm run db:setup
