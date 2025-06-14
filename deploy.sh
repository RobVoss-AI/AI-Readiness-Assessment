#!/bin/bash

# Deployment script for AI Opportunity Scorecard
# This script handles both local development and production deployment

set -e

echo "🚀 Starting AI Opportunity Scorecard Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Determine environment
ENVIRONMENT=${NODE_ENV:-development}
echo "📋 Environment: $ENVIRONMENT"

# Build and start services
echo "🔨 Building Docker containers..."
docker-compose build

echo "🏁 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout 60 bash -c 'until docker-compose ps | grep -q "healthy"; do sleep 2; done'

# Check service health
echo "🏥 Checking service health..."
sleep 5
curl -f http://localhost:3001/health || {
    echo "❌ Health check failed. Check logs:"
    docker-compose logs app
    exit 1
}

echo "✅ Deployment successful!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost (via nginx)"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"