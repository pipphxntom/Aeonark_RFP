# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Install system dependencies required for native modules and pdf processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Copy Tesseract language data for OCR
COPY eng.traineddata ./

# Install development dependencies for build
RUN npm ci

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Remove development dependencies after build
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aeonrfp -u 1001

# Change ownership of app directory
RUN chown -R aeonrfp:nodejs /app
USER aeonrfp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]