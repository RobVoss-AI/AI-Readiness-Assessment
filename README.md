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

## 🤖 AI Executive Reports (Claude Opus 5.5 + GPT-6 Astra)

After the assessment, `POST /api/report` builds a personalized report: an executive summary, strengths and gaps, three industry-specific use cases with hours saved, a 30/60/90-day roadmap, and governance guardrails.

- **Models:** Claude Opus 5.5 (`claude-opus-5-5`) first, GPT-6 Astra (`gpt-6-astra`) as automatic failover, then a rule-based report so the page never breaks. Configure with `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `LLM_PROVIDER_ORDER`.
- **Structured output:** both providers return the same JSON schema (`utils/aiReport.js`), so the UI doesn't care which model answered.
- **Client-data protection:** only industry, role level, org size, scores, and free-text answers go to the model. Names, emails, and company names never leave the server.
- **Consultant brief:** the model also writes an internal sales brief (recommended engagement, talking points, objections). It's added to the HubSpot contact as a note and stripped from the browser response.
- **ROI estimator:** `client/roi-calculator.js` is shared by the results page and the server. Visitors can adjust headcount, hourly cost, repetitive hours, and adoption.
- **Lead scoring:** `utils/leadScoring.js` ranks consulting opportunity (size, gap, authority, intent) instead of readiness. `HUBSPOT_DEAL_THRESHOLD` sets the qualified cutoff.

Run the unit tests with `npm test`. Node 22+ is required.

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development)
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
SUPABASE_API_KEY=your-supabase-service-role-key

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

### Architecture
- **Frontend**: Netlify hosting at `assessment.vossaiconsulting.com`
- **Backend**: Cloud provider with Docker at `api.vossaiconsulting.com`
- **Database**: Supabase (managed PostgreSQL)
- **Cache**: Redis (containerized with backend)

### Quick Production Setup
1. **Frontend**: Deploy to existing Netlify site
2. **Backend**: Deploy Docker container to cloud provider
3. **DNS**: Point `api.vossaiconsulting.com` to backend
4. **Configure**: Set `FRONTEND_URL=https://assessment.vossaiconsulting.com`

See `DEPLOY.md` for detailed deployment instructions.

For support: robvoss@vossaiconsulting.com

---

**Developed by Voss AI Consulting**