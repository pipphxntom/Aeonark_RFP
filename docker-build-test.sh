#!/bin/bash

echo "🐳 Testing Docker Build for AeonRFP"
echo "=================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Build the image
echo "📦 Building Docker image..."
docker build -t aeonrfp-test . || {
    echo "❌ Docker build failed"
    exit 1
}

echo "✅ Docker build successful!"

# Test the image with health check
echo "🚀 Testing container startup..."
docker run -d \
    --name aeonrfp-test-container \
    -p 3001:5000 \
    -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
    -e TITAN_MAIL_PASSWORD="test-password" \
    aeonrfp-test

# Wait for container to start
sleep 5

# Check if container is running
if docker ps | grep -q aeonrfp-test-container; then
    echo "✅ Container started successfully"
    
    # Test health endpoint
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed (expected if no database)"
    fi
else
    echo "❌ Container failed to start"
    docker logs aeonrfp-test-container
fi

# Cleanup
echo "🧹 Cleaning up test containers..."
docker stop aeonrfp-test-container > /dev/null 2>&1
docker rm aeonrfp-test-container > /dev/null 2>&1
docker rmi aeonrfp-test > /dev/null 2>&1

echo "🎉 Docker test completed!"