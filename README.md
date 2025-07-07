# AeonRFP - AI-Powered RFP Analysis Platform

A comprehensive solution for analyzing RFP documents and generating professional proposals using AI.

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
- **OPENAI_API_KEY**: Get from [OpenAI](https://platform.openai.com/api-keys)
- **RESEND_API_KEY**: Get from [Resend](https://resend.com/api-keys)
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
| `OPENAI_API_KEY` | OpenAI API key for AI features | ✅ |
| `RESEND_API_KEY` | Resend API key for email service | ✅ |
| `SESSION_SECRET` | Secret key for session encryption | ✅ |
| `ISSUER_URL` | OAuth issuer URL (production) | ❌ |

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT models
- **Email**: Resend service
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
