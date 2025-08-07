# Docker Deployment Guide for AeonRFP

## Overview
This guide covers deploying AeonRFP using Docker containers. The application includes a Node.js backend with TypeScript, React frontend, PostgreSQL database, and email services.

## Files Created
- `Dockerfile` - Main application container configuration
- `.dockerignore` - Files to exclude from Docker build context
- `docker-compose.yml` - Development/local deployment with PostgreSQL
- `docker-compose.prod.yml` - Production deployment (external database)

## Prerequisites
- Docker and Docker Compose installed
- Environment variables configured (see below)

## Environment Variables Required

### Essential Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
TITAN_MAIL_PASSWORD=your_titan_mail_password
```

### Optional Variables (for enhanced features)
```bash
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
```

## Deployment Options

### Option 1: Local Development with Included PostgreSQL
```bash
# Create .env file with your variables
cp .env.example .env
# Edit .env with your actual values

# Start the application with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Production with External Database (Supabase)
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or with environment variables inline
DATABASE_URL="your_supabase_url" \
TITAN_MAIL_PASSWORD="your_password" \
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Build and Run Manually
```bash
# Build the image
docker build -t aeonrfp .

# Run the container
docker run -d \
  --name aeonrfp-app \
  -p 5000:5000 \
  -e DATABASE_URL="your_database_url" \
  -e TITAN_MAIL_PASSWORD="your_password" \
  -v aeonrfp_uploads:/app/uploads \
  aeonrfp
```

## Application Access
- **Frontend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Features
- **Multi-stage build**: Optimized for production
- **Security**: Non-root user execution
- **Health checks**: Automatic health monitoring
- **Volume mounts**: Persistent file uploads
- **Environment flexibility**: Works with any PostgreSQL database

## Production Considerations

### Database
- Use managed PostgreSQL (Supabase, AWS RDS, etc.)
- Ensure connection pooling is configured
- Set up regular backups

### Scaling
- The application is stateless and can be horizontally scaled
- Use a load balancer for multiple instances
- Store uploaded files in cloud storage (S3, Google Cloud Storage)

### Security
- Use secrets management for environment variables
- Enable HTTPS with reverse proxy (nginx, Cloudflare)
- Configure firewall rules
- Use strong database passwords

### Monitoring
- Built-in health checks work with orchestration platforms
- Monitor logs: `docker-compose logs -f app`
- Consider adding application monitoring (Datadog, New Relic)

## Troubleshooting

### Common Issues
1. **Database connection fails**: Check DATABASE_URL format and network connectivity
2. **Email not working**: Verify TITAN_MAIL_PASSWORD is correct
3. **Build fails**: Check system has enough memory for Node.js build
4. **Port conflicts**: Change port mapping in docker-compose.yml

### Debug Commands
```bash
# Check application logs
docker-compose logs app

# Access container shell
docker-compose exec app sh

# Check database connectivity
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"

# Restart services
docker-compose restart app
```

## Deployment to Cloud Platforms

### AWS ECS/Fargate
- Use docker-compose.prod.yml as base
- Configure task definitions with environment variables
- Use RDS for PostgreSQL

### Google Cloud Run
```bash
# Build and push to container registry
docker build -t gcr.io/PROJECT_ID/aeonrfp .
docker push gcr.io/PROJECT_ID/aeonrfp

# Deploy with environment variables
gcloud run deploy aeonrfp \
  --image gcr.io/PROJECT_ID/aeonrfp \
  --platform managed \
  --set-env-vars DATABASE_URL=your_url,TITAN_MAIL_PASSWORD=your_password
```

### DigitalOcean App Platform
- Connect your GitHub repository
- Use Dockerfile for build
- Configure environment variables in dashboard

The Docker configuration is optimized for production deployment while maintaining development flexibility.