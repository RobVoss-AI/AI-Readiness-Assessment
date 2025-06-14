#!/bin/bash

# DigitalOcean App Platform Deployment Script
# This script helps prepare and deploy your AI Opportunity Scorecard to DigitalOcean

set -e

echo "🌊 DigitalOcean App Platform Deployment Preparation"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env exists and has required variables
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating from example..."
    cp .env.example .env
    echo "✅ Created .env file from example. Please edit it with your production values."
    echo ""
    echo "Required environment variables for DigitalOcean:"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_SERVICE_ROLE_KEY" 
    echo "- HUBSPOT_ACCESS_TOKEN"
    echo "- SESSION_SECRET (change the default!)"
    echo ""
    echo "Edit .env file and run this script again."
    exit 1
fi

# Verify essential environment variables
echo "🔍 Checking environment configuration..."

required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "HUBSPOT_ACCESS_TOKEN")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your-" .env || grep -q "^${var}=$" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing or incomplete environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update your .env file with actual values and try again."
    exit 1
fi

echo "✅ Environment variables look good!"

# Test Docker build locally
echo ""
echo "🔨 Testing Docker build locally..."
docker build -t ai-scorecard-test . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    docker rmi ai-scorecard-test > /dev/null 2>&1
else
    echo "❌ Docker build failed. Please fix build issues before deploying."
    exit 1
fi

# Git status check
echo ""
echo "📋 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. It's recommended to commit before deploying."
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit these changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "Prepare for DigitalOcean deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        git push
        echo "✅ Changes committed and pushed!"
    fi
else
    echo "✅ Git status clean!"
fi

echo ""
echo "🚀 Ready for DigitalOcean App Platform Deployment!"
echo "================================================="
echo ""
echo "Next steps:"
echo "1. Go to https://cloud.digitalocean.com/apps"
echo "2. Click 'Create App'"
echo "3. Connect your GitHub repository: $(git remote get-url origin)"
echo "4. Select branch: $(git branch --show-current)"
echo "5. Configure as Web Service with these settings:"
echo "   - HTTP Port: 3001"
echo "   - Health Check Path: /health"
echo "   - Environment Variables (copy from .env file):"
echo ""

# Show environment variables for easy copy-paste
echo "Environment Variables to add in DigitalOcean:"
echo "--------------------------------------------"
grep -v '^#' .env | grep -v '^$' | while IFS='=' read -r key value; do
    if [[ "$key" =~ ^(NODE_ENV|PORT|FRONTEND_URL|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|HUBSPOT_ACCESS_TOKEN|HUBSPOT_DEAL_THRESHOLD|SESSION_SECRET|CONTACT_EMAIL|CONTACT_PHONE|COMPANY_NAME|PRIMARY_DOMAIN|ASSESSMENT_SUBDOMAIN)$ ]]; then
        echo "$key=$value"
    fi
done

echo ""
echo "Redis Database (add as component):"
echo "- Engine: Redis"  
echo "- Plan: Basic ($15/month)"
echo "- Name: ai-scorecard-redis"
echo ""
echo "Redis Environment Variables (auto-configured by DigitalOcean):"
echo "REDIS_HOST=\${ai-scorecard-redis.HOSTNAME}"
echo "REDIS_PORT=\${ai-scorecard-redis.PORT}" 
echo "REDIS_PASSWORD=\${ai-scorecard-redis.PASSWORD}"
echo ""
echo "Custom Domain:"
echo "- Add domain: api.vossaiconsulting.com"
echo "- Update DNS with CNAME record to your app URL"
echo ""
echo "📖 See DIGITALOCEAN.md for detailed deployment instructions"
echo ""
echo "🎉 Your AI Opportunity Scorecard is ready for the cloud!"