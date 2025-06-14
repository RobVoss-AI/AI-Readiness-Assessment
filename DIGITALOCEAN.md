# DigitalOcean Deployment Guide

Complete guide to deploy your AI Opportunity Scorecard backend to DigitalOcean App Platform.

## 🌊 DigitalOcean App Platform Setup

### Option 1: App Platform (Recommended - Easiest)

DigitalOcean App Platform is perfect for your Docker setup with managed Redis and automatic scaling.

#### Step 1: Create App from GitHub

1. **Go to DigitalOcean Console**: https://cloud.digitalocean.com/apps
2. **Click "Create App"**
3. **Connect GitHub**:
   - Select your repository: `AI-Readiness-Assessment`
   - Choose branch: `main`
   - Auto-deploy: ✅ Enable

#### Step 2: Configure App Settings

**Service Configuration**:
- **Service Type**: Web Service
- **Source**: GitHub repo
- **Branch**: main
- **Build Command**: (leave empty - uses Dockerfile)
- **Run Command**: (leave empty - uses Dockerfile CMD)
- **HTTP Port**: 3001
- **Health Check Path**: `/health`

#### Step 3: Add Redis Database

1. **Add Component** → **Database**
2. **Engine**: Redis
3. **Plan**: Basic ($15/month for production, $7/month for dev)
4. **Name**: `ai-scorecard-redis`

#### Step 4: Environment Variables

Add these environment variables in App Platform:

```bash
# Core Settings
NODE_ENV=production
PORT=3001

# Frontend CORS
FRONTEND_URL=https://assessment.vossaiconsulting.com

# Redis (Auto-configured by DigitalOcean)
REDIS_HOST=${ai-scorecard-redis.HOSTNAME}
REDIS_PORT=${ai-scorecard-redis.PORT}
REDIS_PASSWORD=${ai-scorecard-redis.PASSWORD}

# Supabase
SUPABASE_URL=https://qpfrifnwhcinzhapgjqf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# HubSpot
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token
HUBSPOT_DEAL_THRESHOLD=70

# Security
SESSION_SECRET=your-secure-random-session-secret-change-this

# Contact Info
CONTACT_EMAIL=robvoss@vossaiconsulting.com
CONTACT_PHONE=660-215-1313
COMPANY_NAME=Voss AI Consulting
PRIMARY_DOMAIN=vossaiconsulting.com
ASSESSMENT_SUBDOMAIN=assessment.vossaiconsulting.com
```

#### Step 5: Configure Custom Domain

1. **Go to Settings** → **Domains**
2. **Add Domain**: `api.vossaiconsulting.com`
3. **DNS Configuration**: Add CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: your-app-name-xxxxx.ondigitalocean.app
   TTL: 300
   ```

### Option 2: Droplet + Docker Compose (Advanced)

If you prefer more control, deploy to a Droplet:

#### Step 1: Create Droplet

1. **Create Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic $12/month (2GB RAM, 1 vCPU)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended)

#### Step 2: Setup Droplet

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt update
apt install docker-compose-plugin

# Clone your repository
git clone https://github.com/RobVoss-AI/AI-Readiness-Assessment.git
cd AI-Readiness-Assessment

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your production values
```

#### Step 3: Deploy with Docker Compose

```bash
# Start the application
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f app

# Check health
curl http://localhost:3001/health
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt update
apt install nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/api.vossaiconsulting.com << 'EOF'
server {
    listen 80;
    server_name api.vossaiconsulting.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/api.vossaiconsulting.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Setup SSL with Let's Encrypt
certbot --nginx -d api.vossaiconsulting.com
```

## 🔧 Required Code Updates for DigitalOcean

Since DigitalOcean's managed Redis works differently, update your Redis configuration:

```javascript
// utils/redis.js - Add DigitalOcean Redis support
const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const redisConfig = {
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT || 6379,
            };

            // Add password for DigitalOcean managed Redis
            if (process.env.REDIS_PASSWORD) {
                redisConfig.password = process.env.REDIS_PASSWORD;
            }

            // Add TLS for managed Redis if needed
            if (process.env.REDIS_TLS === 'true') {
                redisConfig.tls = {};
            }

            this.client = redis.createClient(redisConfig);
            
            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
                this.isConnected = true;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error);
            this.isConnected = false;
            return null;
        }
    }
}
```

## 📋 Pre-Deployment Checklist

### Required Information:
- [ ] DigitalOcean account access
- [ ] GitHub repository connected
- [ ] Supabase credentials
- [ ] HubSpot access token
- [ ] Domain DNS access for `api.vossaiconsulting.com`

### Deployment Steps:
1. [ ] Create DigitalOcean App
2. [ ] Add Redis database
3. [ ] Configure environment variables
4. [ ] Deploy from GitHub
5. [ ] Setup custom domain
6. [ ] Test health endpoint
7. [ ] Verify HubSpot integration

## 🚀 Deployment Commands

### Quick Deploy to App Platform:
```bash
# Update code and push to trigger deployment
git add .
git commit -m "Production deployment updates"
git push origin main
# App Platform will auto-deploy
```

### Monitor Deployment:
```bash
# Check deployment status in DigitalOcean console
# View runtime logs in App Platform
# Test health endpoint: https://api.vossaiconsulting.com/health
```

## 💰 Cost Estimation

### App Platform (Recommended):
- **Web Service**: $12/month (Basic)
- **Redis Database**: $15/month (Basic)
- **Total**: ~$27/month

### Droplet Alternative:
- **Droplet**: $12/month (2GB)
- **Load Balancer** (optional): $12/month
- **Total**: $12-24/month

## 🔍 Testing Your Deployment

### 1. Health Check
```bash
curl https://api.vossaiconsulting.com/health
```

Expected response:
```json
{
  "status": "OK",
  "redis": true,
  "supabase": true,
  "hubspot": true,
  "services": {
    "cache": "healthy",
    "database": "healthy",
    "crm": "healthy"
  }
}
```

### 2. Frontend Integration Test
1. Visit: `https://assessment.vossaiconsulting.com`
2. Open browser console
3. Look for: `API Base URL: https://api.vossaiconsulting.com/api`
4. Complete a test assessment
5. Verify HubSpot contact creation

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Dockerfile syntax
   - Verify all dependencies in backend.json
   - Review build logs in App Platform

2. **Redis Connection Issues**:
   - Verify Redis database is running
   - Check environment variable names
   - Confirm password configuration

3. **CORS Errors**:
   - Verify `FRONTEND_URL` is set correctly
   - Check domain spelling
   - Confirm SSL is working

4. **HubSpot Integration Fails**:
   - Test access token validity
   - Check custom properties in HubSpot
   - Review environment variables

### Debug Commands:
```bash
# App Platform logs
doctl apps logs <app-id>

# Test API connectivity
curl -v https://api.vossaiconsulting.com/health

# Check DNS resolution
dig api.vossaiconsulting.com
```

## 📞 Next Steps After Deployment

1. **Update Netlify**: Redeploy frontend to use production API
2. **Monitor Performance**: Set up alerts in DigitalOcean
3. **Backup Strategy**: Configure database backups
4. **SSL Certificate**: Verify auto-renewal is working
5. **Analytics**: Monitor API usage and response times

---

**Your AI Opportunity Scorecard backend will be live on DigitalOcean! 🌊**

Need help? Contact: robvoss@vossaiconsulting.com