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
```

## Recent Changes

The application has been significantly enhanced with two major new features:

1. **AI Proposal Editor UI**: A comprehensive workspace allowing users to edit proposals section by section, with AI-powered regeneration capabilities and a memory engine that suggests reusable clauses from past successful proposals.

2. **Analytics Dashboard**: A mission control interface providing real-time insights into proposal performance, win rates, time savings, and usage analytics with interactive charts and conversion funnels.

Both features are fully integrated with the existing authentication system and include proper database storage, API endpoints, and futuristic UI styling consistent with the space-themed design.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```