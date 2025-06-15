# Free Deployment Options - No Monthly Costs

Deploy your AI Opportunity Scorecard without paying monthly hosting fees.

## 🆓 Option 1: Netlify + Railway (Free Tiers)

### Frontend: Netlify (Free)
- ✅ Free tier: 100GB bandwidth/month
- ✅ Custom domain: `assessment.vossaiconsulting.com`
- ✅ Auto-deploy from GitHub
- ✅ SSL certificates included

### Backend: Railway (Free $5 credit/month)
- ✅ Free $5 credit monthly (covers small apps)
- ✅ Docker container support
- ✅ Managed Redis included
- ✅ Custom domain support
- ✅ Auto-deploy from GitHub

**Total Cost: $0/month** (within free limits)

### Railway Setup:
1. Go to: https://railway.app
2. Sign up with GitHub
3. "Deploy from GitHub" → Select your repo
4. Railway auto-detects Dockerfile
5. Add environment variables
6. Add Redis database (included in free tier)
7. Connect custom domain: `api.vossaiconsulting.com`

## 🆓 Option 2: Netlify + Render (Free)

### Backend: Render (Free Web Service)
- ✅ Free tier with 750 hours/month
- ✅ Auto-sleep after 15 mins (spins up on request)
- ✅ Docker support
- ✅ SSL included

**Limitation**: Free tier sleeps, so first request takes ~10 seconds to wake up.

### Render Setup:
1. Go to: https://render.com
2. Connect GitHub repository
3. Create "Web Service" from Docker
4. Add environment variables
5. Note: You'll need external Redis (see Redis options below)

## 🆓 Option 3: Frontend-Only Deployment (Simplest)

**Deploy only the frontend and keep using Google Apps Script for data collection.**

### Revert to Google Apps Script:
```javascript
// Simple change in frontend files
const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

**Benefits:**
- ✅ Zero hosting costs
- ✅ No backend maintenance
- ✅ Google handles scaling
- ❌ No HubSpot integration
- ❌ No Redis caching

## 🆓 Option 4: GitHub Pages + Serverless Functions

### Frontend: GitHub Pages (Free)
- Host static files for free
- Custom domain support

### Backend: Vercel/Netlify Functions (Free tiers)
- Serverless functions for API endpoints
- Limited but free for small usage

## 🔧 Redis Options for Free Deployments

### Redis Cloud (Free tier)
- 30MB free Redis database
- Perfect for sessions and caching
- Get connection details and use in your app

### Upstash (Free tier)
- Serverless Redis
- 10,000 requests/day free
- Good for small applications

## 📝 Quick Setup: Railway Deployment

Let me show you the Railway setup since it's the easiest free option:

### 1. Prepare for Railway
```bash
# Your app is already Railway-ready with Dockerfile!
# No changes needed to your code
```

### 2. Environment Variables for Railway
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://assessment.vossaiconsulting.com

# Supabase (you have these)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-key

# HubSpot (you have this)
HUBSPOT_ACCESS_TOKEN=your-token
HUBSPOT_DEAL_THRESHOLD=70

# Redis (Railway provides this automatically)
# No need to set - Railway auto-configures

# Security
SESSION_SECRET=your-secure-random-string

# Contact info
CONTACT_EMAIL=robvoss@vossaiconsulting.com
CONTACT_PHONE=660-215-1313
COMPANY_NAME=Voss AI Consulting
```

### 3. Railway Deployment Steps
1. Visit: https://railway.app
2. "Start a New Project"
3. "Deploy from GitHub repo"
4. Select: `AI-Readiness-Assessment`
5. Railway auto-detects Dockerfile
6. Add Redis database: "Add Plugin" → Redis
7. Add environment variables from above
8. Deploy!
9. Add custom domain: `api.vossaiconsulting.com`

### 4. Update Netlify Frontend
```bash
# Your frontend will automatically use the production API
# Just redeploy to Netlify and it will work!
```

## 💰 Cost Comparison

| Option | Frontend | Backend | Redis | Total/Month |
|--------|----------|---------|-------|-------------|
| Railway | Netlify (Free) | Railway ($0-5) | Included | **$0-5** |
| Render | Netlify (Free) | Render (Free) | External ($0) | **$0** |
| DigitalOcean | Netlify (Free) | App Platform ($12) | Managed ($15) | **$27** |
| Frontend Only | Netlify (Free) | Google Script | None | **$0** |

## 🚀 Recommended Path: Railway

Railway is perfect because:
- ✅ **Free $5 credit monthly** (covers your usage)
- ✅ **No sleep/wake delays** (unlike Render free tier)
- ✅ **Managed Redis included** 
- ✅ **Easy Docker deployment**
- ✅ **Custom domain support**
- ✅ **Auto-scaling within free limits**

## 🔄 Fallback Strategy

If you hit Railway's free limits:
1. **Monitor usage** in Railway dashboard
2. **Optimize**: Add caching, reduce API calls
3. **Scale down**: Use smaller Redis, fewer requests
4. **Alternative**: Switch to Google Apps Script temporarily

## 🎯 Action Plan

1. **Deploy to Railway** (5 minutes setup)
2. **Keep Netlify frontend** (already configured)
3. **Monitor usage** (Railway provides good analytics)
4. **Optimize if needed** (add more caching, reduce requests)

Your AI Opportunity Scorecard can run completely free! 🎉

## 📞 Need Help?

The Railway deployment is straightforward, but if you need assistance:
- Email: robvoss@vossaiconsulting.com
- Railway docs: https://docs.railway.app