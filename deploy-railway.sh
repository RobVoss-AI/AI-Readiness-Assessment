#!/bin/bash

# Railway.app Free Deployment Script
# Deploy your AI Opportunity Scorecard to Railway for free!

set -e

echo "🚂 Railway.app Free Deployment Setup"
echo "===================================="
echo ""
echo "Railway offers $5 free credit monthly - perfect for your app!"
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Your app is Railway-ready with Docker!"
echo ""

# Check environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env from example..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual values and run this script again."
    exit 1
fi

echo "🔍 Checking required environment variables..."

required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "HUBSPOT_ACCESS_TOKEN")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your-" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Please set these environment variables in .env:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ Environment variables ready!"
echo ""

# Git check
echo "📋 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes."
    read -p "Commit changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Railway deployment"
        git push
        echo "✅ Changes pushed!"
    fi
fi

echo ""
echo "🎯 Railway Deployment Instructions:"
echo "=================================="
echo ""
echo "1. Go to: https://railway.app"
echo "2. Sign up with GitHub (free)"
echo "3. Click 'Deploy from GitHub repo'"
echo "4. Select: $(basename $(git remote get-url origin) .git)"
echo "5. Railway auto-detects your Dockerfile ✅"
echo ""
echo "6. Add Redis database:"
echo "   - Click '+ New' → 'Database' → 'Add Redis'"
echo "   - Railway auto-configures connection"
echo ""
echo "7. Add these environment variables:"
echo "   (Railway dashboard → Variables tab)"
echo ""

# Show essential environment variables
echo "Environment Variables for Railway:"
echo "================================="
echo "NODE_ENV=production"
echo "PORT=3001"
echo "FRONTEND_URL=https://assessment.vossaiconsulting.com"
echo ""

# Show variables from .env (excluding sensitive defaults)
grep -v '^#' .env | grep -v '^$' | while IFS='=' read -r key value; do
    if [[ "$key" =~ ^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|HUBSPOT_ACCESS_TOKEN|HUBSPOT_DEAL_THRESHOLD|CONTACT_EMAIL|CONTACT_PHONE|COMPANY_NAME|PRIMARY_DOMAIN|ASSESSMENT_SUBDOMAIN)$ ]]; then
        echo "$key=$value"
    fi
done

echo ""
echo "SESSION_SECRET=your-secure-random-string-here"
echo ""
echo "8. Deploy and get your Railway URL"
echo ""
echo "9. Add custom domain (optional):"
echo "   - Railway dashboard → Settings → Domains"
echo "   - Add: api.vossaiconsulting.com"
echo "   - Update your DNS with CNAME record"
echo ""
echo "🎉 Your app will be live and FREE!"
echo ""
echo "💡 Railway Free Tier includes:"
echo "   - $5 credit monthly (covers small apps)"
echo "   - Redis database included"
echo "   - Custom domains"
echo "   - Auto-deploy from GitHub"
echo "   - No sleep/wake delays"
echo ""
echo "📊 Monitor usage: Railway dashboard shows credit usage"
echo "🔄 If you exceed free tier, consider optimizations or Google Apps Script fallback"
echo ""
echo "🚂 All aboard the Railway! Your AI Scorecard is ready for free deployment!"