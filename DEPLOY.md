# Deployment Guide - Netlify + Cloud Backend

This guide covers deploying your AI Opportunity Scorecard with the frontend on Netlify and backend on a cloud provider.

## 🌐 Architecture Overview

- **Frontend**: `assessment.vossaiconsulting.com` (Netlify)
- **Backend API**: `api.vossaiconsulting.com` (Cloud Provider)
- **Database**: Supabase (managed)
- **Cache**: Redis (containerized with backend)
- **CRM**: HubSpot (SaaS)

## 📋 Prerequisites

- Netlify account with custom domain configured
- Cloud provider account (AWS/DigitalOcean/Railway/etc.)
- Domain access to create `api.vossaiconsulting.com` subdomain
- Supabase project setup
- HubSpot access token

## 🚀 Step 1: Deploy Frontend to Netlify

### Option A: Automatic Git Deployment (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root)
3. Deploy automatically on git push

### Option B: Manual Deployment
1. Upload these files to Netlify:
   ```
   index.html
   user-info.html
   assessment-clean.html
   results-new.html
   payment.html
   *.js files
   *.css files
   images/
   netlify.toml
   ```

### Netlify Configuration
The `netlify.toml` file includes:
- API proxy rules to backend
- Security headers
- Cache optimization
- SPA routing support

## ⚙️ Step 2: Deploy Backend to Cloud Provider

### Recommended Providers:
- **Railway**: Simple container deployment
- **DigitalOcean App Platform**: Managed containers
- **AWS ECS**: Enterprise-grade
- **Google Cloud Run**: Serverless containers

### Deployment Steps:
1. **Build and push Docker image**:
   ```bash
   docker build -t your-registry/ai-scorecard-backend .
   docker push your-registry/ai-scorecard-backend
   ```

2. **Set environment variables** on cloud provider:
   ```bash
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://assessment.vossaiconsulting.com
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-key
   HUBSPOT_ACCESS_TOKEN=your-token
   SESSION_SECRET=your-secure-secret
   # Redis will be deployed as part of the container
   ```

3. **Configure health checks**: Point to `/health` endpoint

4. **Setup SSL**: Most providers handle this automatically

## 🌍 Step 3: Configure Domain DNS

Add DNS record for backend API:
```
Type: CNAME
Name: api
Value: your-cloud-provider-url.com
TTL: 300
```

## 🔧 Step 4: Environment-Specific Configuration

### Frontend Detection
The frontend automatically detects environment:
- **Local**: Uses `http://localhost:3001/api`
- **Production**: Uses `https://api.vossaiconsulting.com/api`

### Testing Production Setup
1. Deploy backend and get URL
2. Update DNS for `api.vossaiconsulting.com`
3. Deploy frontend to Netlify
4. Test assessment flow end-to-end

## 📊 Step 5: Verify Integration

### Test Checklist:
- [ ] Frontend loads at `assessment.vossaiconsulting.com`
- [ ] Backend health check: `https://api.vossaiconsulting.com/health`
- [ ] User registration saves data
- [ ] Assessment completion works
- [ ] HubSpot contact creation
- [ ] Analytics and benchmarking

### Health Check Response:
```json
{
  "status": "OK",
  "timestamp": "2025-06-14T21:00:05.842Z",
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

## 🔄 Step 6: Continuous Deployment

### Frontend (Netlify):
- Automatic deployment on git push to main branch
- Branch previews for testing
- Custom build commands if needed

### Backend:
- Set up CI/CD pipeline to rebuild on code changes
- Use health checks for zero-downtime deployments
- Monitor logs and performance

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Verify `FRONTEND_URL` in backend environment
   - Check domain spelling

2. **API Connection Failed**:
   - Verify `api.vossaiconsulting.com` DNS
   - Check SSL certificate
   - Confirm backend is running

3. **HubSpot Integration Issues**:
   - Verify access token validity
   - Check custom property setup in HubSpot

### Debug Commands:
```bash
# Test API connectivity
curl https://api.vossaiconsulting.com/health

# Check frontend API detection
# Open browser console on assessment.vossaiconsulting.com
# Look for "API Base URL" logs
```

## 📞 Support

For deployment assistance:
- Email: robvoss@vossaiconsulting.com
- Phone: 660-215-1313

---

**Your AI Opportunity Scorecard is ready for production! 🎉**