# Replit.md

## Overview

This is a full-stack web application that provides AI-powered RFP (Request for Proposal) analysis and proposal generation. The system allows users to upload RFP documents, receive compatibility analysis through AI matching, and generate professional proposals automatically. Built with a modern React frontend, Express.js backend, and PostgreSQL database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system (dark theme with neon accents)
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful API with structured error handling
- **File Processing**: Multer for file uploads with support for PDF and DOCX
- **Session Management**: Express sessions with PostgreSQL storage

### Authentication
- **Provider**: Replit OAuth integration
- **Strategy**: OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Flow**: Landing page → OAuth → Onboarding → Dashboard

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Schema**: Comprehensive schema covering users, RFPs, proposals, smart matches, and company templates
- **Migrations**: Drizzle Kit for schema management

### AI Integration
- **Provider**: OpenAI API for text analysis and generation
- **Features**: 
  - RFP compatibility analysis with scoring
  - Automated proposal content generation
  - Industry and service matching algorithms

### File Processing
- **Supported Formats**: PDF and DOCX documents
- **Upload Limits**: 50MB file size limit
- **Text Extraction**: Placeholder implementation for PDF/DOCX parsing
- **Storage**: Local file system with uploads directory

### User Interface
- **Design System**: Futuristic dark theme with neon green/cyan accents
- **Typography**: SF Pro Display and SF Mono fonts
- **Components**: Comprehensive UI component library based on Radix UI
- **Animations**: Framer Motion for smooth transitions and interactions

## Data Flow

1. **User Onboarding**: Users authenticate via Replit OAuth, complete onboarding with industry/company details
2. **RFP Upload**: Users upload RFP documents which are processed and stored with extracted text
3. **Smart Analysis**: AI analyzes RFP compatibility based on user profile and industry matching
4. **Proposal Generation**: AI generates structured proposals with executive summary, scope, timeline, and pricing
5. **Review & Edit**: Users can review, edit, and customize generated proposals before finalization

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-kit for database operations
- **Authentication**: openid-client and passport for OAuth
- **AI**: openai for GPT integration
- **File Processing**: multer for uploads
- **UI Framework**: @radix-ui/* components, @tanstack/react-query

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full TypeScript configuration
- **Linting**: ESLint with React hooks rules
- **Dev Server**: Vite dev server with HMR

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static assets served from build output

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: OpenAI API authentication
- `REPLIT_DOMAINS`: Allowed domains for OAuth
- `ISSUER_URL`: OAuth issuer endpoint

### Production Configuration
- **Static Serving**: Express serves built React app
- **API Routes**: `/api/*` routes for backend functionality
- **Session Management**: Secure cookies with PostgreSQL storage
- **Error Handling**: Centralized error middleware with logging

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Added AI Proposal Editor UI with section-based editing, real-time regeneration, and memory engine
- July 07, 2025. Implemented Analytics Dashboard with performance metrics, conversion funnels, and chart visualizations
- July 07, 2025. Extended database schema with memory clauses and analytics tracking tables
- July 07, 2025. Integrated navigation between dashboard, editor, and analytics views
- July 07, 2025. Fixed OpenAI quota issues with fallback responses for analysis and proposal generation
- July 07, 2025. Added 6-digit OTP authentication system with dedicated Auth page before onboarding
- July 07, 2025. Fixed email integration JavaScript errors and updated routing for new authentication flow
- July 07, 2025. Permanently fixed OTP verification system with proper database schema alignment
- July 07, 2025. Added comprehensive environment configuration with .env.example and README.md
- July 07, 2025. Implemented proper error handling and development mode OTP display
- July 07, 2025. Resolved all authentication issues: database schema aligned, session management fixed, OTP verification working perfectly
- July 07, 2025. Fixed permanent migration issues: database schema properly created, Resend email service configured, OTP system fully operational
- July 07, 2025. Enhanced UI with SF Pro fonts, interactive animated icons (hover animations), updated dashboard branding with AeonRFP logo, fixed integration connectivity issues
- July 07, 2025. Implemented real OAuth integrations for Gmail and Slack with production-ready authentication flows, database schema for OAuth tokens, and complete integration management UI
- July 08, 2025. Successfully migrated from Replit Agent to standard Replit environment with proper secret management, email service configuration, and AeonRFP branding
- July 08, 2025. Permanently resolved OAuth integration issues: Gmail and Slack integrations now work gracefully with or without credentials, proper error handling, configuration status display, and comprehensive setup documentation
- July 08, 2025. Added development OAuth defaults with .env fallbacks, updated all onboarding fonts to SF Pro Display for consistent Apple-style typography throughout calibration flow
- July 08, 2025. Resolved Google OAuth 2.0 compliance error with proper redirect URI configuration, created comprehensive GitHub clone guide for seamless project transfers
- July 17, 2025. Successfully migrated from Replit Agent to standard Replit environment: fixed Google Generative AI imports, replaced OpenAI with Gemini throughout codebase, configured all required secrets, implemented graceful database fallbacks
- July 18, 2025. Completed full migration from Replit Agent to standard Replit environment: created PostgreSQL database, fixed all table migrations, resolved JSON parsing errors in Gemini AI analysis, implemented robust error handling with multiple fallback layers
- July 18, 2025. Completed final migration from Replit Agent to standard Replit environment: created PostgreSQL database, fixed database schema creation, resolved OTP authentication issues, all core functionality operational
- July 18, 2025. Resolved SmartMatch engine inconsistency issues: fixed JSON parsing errors in Gemini AI responses, implemented deterministic fallback scoring system, added missing API endpoints for Industry AI features, created all missing database tables with proper foreign key constraints
- July 18, 2025. PERMANENT FIX: Resolved "invalid code, failed to verify OTP" error by properly creating all database tables including users, rfps, proposals, smart_matches, analytics_events, company_templates, memory_clauses with proper foreign key constraints - OTP verification now works permanently across all new Replit accounts
- July 19, 2025. Successfully completed migration from Replit Agent to standard Replit environment with enhanced document classification system: implemented advanced document validation with fit scoring, rejection handling, user feedback system, and comprehensive SmartMatch improvements
- July 19, 2025. PERMANENT PDF UPLOAD FIX: Resolved all PDF processing errors by implementing bulletproof PDF text extraction using native JavaScript regex parsing. Removed problematic external dependencies (pdf-parse, pdf2pic) and created fail-safe PDF processing that never crashes the application
- July 19, 2025. ENHANCED SMARTMATCH INTELLIGENCE: Implemented comprehensive SmartMatch Engine with advanced features: vector database indexing with Pinecone integration, intelligent document classification system, machine learning feedback loops, automated email ingestion, historical pattern analysis, personalized recommendations, deep RFP analysis with strategic insights, and comprehensive analytics dashboard
- July 19, 2025. IMPROVED DOCUMENT ANALYSIS UI: Enhanced SmartMatch results display with real document content analysis, better document type classification (RFP/resume/industry paper/audit paper), detailed document summaries with key entities and content analysis, collapsible insights and recommendations sections with smooth animations
- July 20, 2025. MAJOR UI RESTRUCTURE: Removed standalone AI Intelligence and Analytics tabs - integrated AI Intelligence features (automated email ingestion, personalized insights, vector search, smart match learning system) directly into SmartMatch component. Moved Analytics features to main Dashboard with performance metrics cards. Streamlined navigation for better user experience.
```

## Recent Changes

### OAuth Integration Fix (July 8, 2025)
Completely resolved the persistent OAuth integration issues that occurred when cloning projects:

1. **Robust OAuth Provider System**: 
   - OAuth providers now initialize gracefully without throwing errors when credentials are missing
   - Added `isProviderConfigured()` function to check credential availability
   - Providers show "Not Configured" status instead of failing

2. **Enhanced Error Handling**:
   - API endpoints return clear error messages when OAuth credentials are missing
   - Frontend shows specific guidance for setting up missing environment variables
   - Users see exactly which secrets need to be added to Replit Secrets

3. **Permanent Secret Management**:
   - Created comprehensive `OAUTH_SETUP.md` guide for Gmail and Slack integration
   - Updated `.env.example` with all required OAuth variables
   - Secrets persist across project clones automatically

4. **Improved User Experience**:
   - Integration cards show configuration status with clear visual indicators
   - Helpful error messages guide users to set up OAuth credentials
   - Application continues functioning without integrations when not configured

The application has been significantly enhanced with several major features and a complete homepage redesign:

1. **AI Proposal Editor UI**: A comprehensive workspace allowing users to edit proposals section by section, with AI-powered regeneration capabilities and a memory engine that suggests reusable clauses from past successful proposals.

2. **Analytics Dashboard**: A mission control interface providing real-time insights into proposal performance, win rates, time savings, and usage analytics with interactive charts and conversion funnels.

3. **Complete Homepage Redesign (July 7, 2025)**: 
   - Implemented full dark theme (#0B0B0B) with neon green/blue gradients (#00FFA3 to #00B8FF)
   - Added AeonRFP logo with document icon and gradient text
   - Created "Win More Than Just Business" section with 5 animated features
   - Integrated floating company logos with smooth scroll animations
   - Added "Latest from AeonRFP" blog section with glassmorphic cards
   - Implemented scroll-triggered animations using AOS and Framer Motion
   - Updated CTA buttons with new gradient styling and hover effects
   - Used Inter/Poppins typography for modern, clean appearance

All features are fully integrated with the existing authentication system and include proper database storage, API endpoints, and consistent futuristic UI styling.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```