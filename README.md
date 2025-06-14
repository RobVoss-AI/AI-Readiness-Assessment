# AI Opportunity Scorecard - Full Stack Application

A comprehensive AI readiness assessment tool with enterprise-grade features including Docker containerization, Redis caching, Supabase database, and HubSpot CRM integration.

## 🚀 Features

- **🔥 Full-Stack Architecture**: Express.js backend with Docker containerization
- **⚡ Redis Integration**: Caching, session management, and rate limiting
- **🗄️ Supabase Database**: PostgreSQL with Row Level Security and real-time features
- **📈 HubSpot CRM**: Automated lead management and deal creation
- **🎯 Assessment Engine**: Industry-specific AI readiness evaluation
- **📊 Analytics**: Real-time assessment statistics and benchmarking
- **🔒 Security**: Rate limiting, input validation, and secure session management

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Supabase account and project
- HubSpot account with API access
- Git

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/RobVoss-AI/AI-Readiness-Assessment.git
cd AI-Readiness-Assessment
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# HubSpot CRM Integration
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token

# Domain Configuration (for production)
PRIMARY_DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
```

### 3. Setup Supabase Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the schema creation scripts:
   ```sql
   -- Run these files in order:
   -- 1. database/schema.sql
   -- 2. database/policies.sql  
   -- 3. database/seed-data.sql
   ```

### 4. Deploy with Docker

```bash
./deploy.sh
```

Or manually:

```bash
docker-compose up -d
```

### 5. Verify Deployment

Check health endpoint:
```bash
curl http://localhost:3001/health
```

Access application:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🗄️ Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- `assessments` - Assessment data and scores
- `users` - User registration information
- `questions` - Dynamic question management
- `question_sections` - Assessment sections
- `benchmarks` - Industry benchmarking data

## 🎯 HubSpot Integration

### Features
- **Contact Creation**: Automatic contact creation with AI scores
- **Deal Management**: High-scoring assessments (≥70) create deals
- **Detailed Notes**: Assessment insights and open-ended responses
- **Lead Tracking**: Source attribution and scoring

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production domain in `FRONTEND_URL`
3. Use secure session secrets
4. Enable rate limiting and security features

### Hosting Options
- Deploy Docker containers to cloud provider
- Use static hosting for frontend files
- Configure API subdomain (api.yourdomain.com)

For support: robvoss@vossaiconsulting.com

---

**Developed by Voss AI Consulting**