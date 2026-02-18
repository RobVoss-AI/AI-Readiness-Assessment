# AI Readiness Assessment — Complete Rebuild Specification

> **Purpose**: This document is a complete blueprint for another Claude Code instance to rebuild the AI Readiness Assessment from scratch. It captures every business rule, question, scoring formula, data destination, and architectural decision — plus the new organizational model. Read this entire document before writing any code.

---

## Table of Contents

1. [Product Overview & Pivot](#1-product-overview--pivot)
2. [User Model & Roles](#2-user-model--roles)
3. [User Flow (Step by Step)](#3-user-flow-step-by-step)
4. [Complete Question Bank](#4-complete-question-bank)
5. [Scoring Engine](#5-scoring-engine)
6. [Results & Insights Logic](#6-results--insights-logic)
7. [Organization Dashboard](#7-organization-dashboard)
8. [Data Model & Schema](#8-data-model--schema)
9. [API Endpoints](#9-api-endpoints)
10. [Integrations (HubSpot, Supabase, Redis)](#10-integrations)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Configuration & Environment](#12-configuration--environment)
13. [Deployment](#13-deployment)
14. [Current Problems to Fix](#14-current-problems-to-fix)
15. [Tech Stack Decisions](#15-tech-stack-decisions)

---

## 1. Product Overview & Pivot

### What This Is
A web-based assessment that evaluates an organization's readiness to adopt AI across 6 dimensions: Strategy, Operations, Technology, Data, Culture, and Automation. It produces scored results with actionable insights.

### The Pivot
**Before**: Individuals took this assessment for their own benefit. One person, one result, done.

**Now**: Individuals take the assessment **as members of an organization**. This means:
- Multiple people from the same organization can take the assessment
- Each person answers from their own perspective and role
- The organization gets an **aggregate view** showing where alignment exists and where perspectives diverge
- An organization admin (the person who sets up the assessment) can invite team members and view a dashboard of all responses
- Individual results are still shown to each person immediately after completing
- The organization-level rollup reveals blind spots (e.g., leadership thinks data quality is high, but individual contributors disagree)

### Business Context
This assessment is operated by Voss AI Consulting. Completed assessments generate leads:
- Scores >= 70 are "qualified" leads
- Scores < 70 are "unqualified" leads
- All completions create contacts and deals in HubSpot CRM
- Free-text responses are captured as HubSpot notes for sales context

---

## 2. User Model & Roles

### Organization Admin
- Creates the organization in the system
- Gets a **shareable invite link** (e.g., `https://assessment.example.com/org/abc123`)
- Can view the **Organization Dashboard** with aggregate results
- Receives email notifications when team members complete assessments
- Is also a respondent (takes the assessment themselves)

### Respondent (Team Member)
- Arrives via invite link or direct URL
- Provides their info (name, email, role, job title)
- Takes the 6-section assessment
- Sees their individual results immediately
- Their responses contribute to the organization's aggregate scores

### Role Levels (used for question filtering and analysis)
- **Executive** (C-suite, VP)
- **Manager** (Director, Senior Manager, Team Lead)
- **Individual Contributor** (Staff, Analyst, Developer, etc.)

### Organization Info Collected
- Organization name
- Industry (dropdown — see list below)
- Organization size: `1-10`, `11-50`, `51-200`, `201-1000`, `1000+`
- The admin's info (name, email, job title, role level)

### Industries
- Finance & Banking
- Healthcare
- Education
- Technology
- Manufacturing
- Legal
- Retail
- Consulting
- Government
- Non-Profit
- Other

---

## 3. User Flow (Step by Step)

### Flow A: Organization Admin (First Person)

```
1. Landing Page
   → "Start Your Organization's Assessment" button

2. Organization Setup Form
   → Organization name
   → Industry (dropdown)
   → Organization size (dropdown)
   → Admin's first name, last name, email, job title, role level
   → Consent checkbox
   → Submit → creates org, generates invite link, saves admin as first respondent

3. Assessment (6 sections, one at a time)
   → Each section shows questions with Likert scale (1-5) + one open-ended text question
   → Progress bar shows overall completion
   → "Previous" and "Next" navigation between sections
   → All Likert questions required per section before advancing
   → Open-ended questions optional
   → Answers saved to backend on each section advance (not just localStorage)

4. Individual Results Page
   → Overall score (0-100) with animated counter
   → Radar chart showing all 6 dimensions
   → Readiness level badge (Beginning / Developing / Intermediate / Advanced)
   → Dynamic insights (strengths, weaknesses, recommendations)
   → Action plan (immediate / short-term / long-term)
   → "Share with your team" section showing the invite link + copy button
   → "View Organization Dashboard" button (visible to admin only)

5. Organization Dashboard (admin only, accessible anytime)
   → Aggregate scores across all respondents
   → Response count and completion status
   → Score comparison by role level
   → Alignment/divergence heat map
   → Individual response list (anonymized scores, or named if org allows)
```

### Flow B: Invited Team Member

```
1. Arrives via invite link (e.g., /org/abc123)
   → Sees the organization name and a message like "You've been invited to take the AI Readiness Assessment for [Org Name]"

2. User Info Form (no org setup — org is pre-filled from invite link)
   → First name, last name, email, job title, role level
   → Consent checkbox
   → Submit

3. Assessment (identical to admin flow)

4. Individual Results Page (identical to admin flow)
   → Does NOT see "View Organization Dashboard" link
   → Does see "Your team's combined results will be shared with [Admin Name]"
```

---

## 4. Complete Question Bank

The assessment has **6 sections** with **32 questions total** (26 scored Likert + 6 open-ended text). Every Likert question uses this 5-point scale:

| Value | Label             |
|-------|-------------------|
| 0     | Strongly Disagree |
| 1     | Disagree          |
| 2     | Neutral / Unsure  |
| 3     | Agree             |
| 4     | Strongly Agree    |

Scores are normalized to 0-100 scale: `(value / 4) * 100`

### Section 1: AI Strategy & Vision
- **Section weight**: 1.2
- **Description**: Assess your organization's strategic approach to AI adoption and governance

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `strategy_vision` | likert | 1.5 | yes | all | Our organization has a clear, documented AI strategy that connects to specific business objectives. |
| 2 | `strategy_problems` | likert | 1.3 | yes | Manager, Executive | We have identified concrete use cases where AI — including generative AI and AI agents — can drive measurable outcomes (e.g., cost reduction, revenue growth, quality improvement). |
| 3 | `strategy_leadership` | likert | 1.4 | yes | all | Senior leaders actively champion AI initiatives by setting goals, allocating resources, and removing barriers. |
| 4 | `strategy_budget` | likert | 1.2 | yes | Manager, Executive | We have dedicated budget and staffing for AI initiatives, including tools, training, and implementation. |
| 5 | `strategy_risk_culture` | likert | 1.3 | yes | all | Our organization has an AI governance framework that addresses ethics, responsible use, and risk management. |
| 6 | `strategy_obstacles` | text | 1.0 | no | all | What is your biggest strategic challenge or opportunity when it comes to AI adoption? |

**Help text for Q1**: "A clear AI strategy aligns initiatives with business goals and prevents scattered adoption"
**Placeholder for Q6**: "e.g., Unclear ROI expectations, lack of AI governance, exciting generative AI possibilities"

### Section 2: Operational Readiness
- **Section weight**: 1.0
- **Description**: Evaluate how well your operations can integrate AI-powered solutions

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `ops_process_mapping` | likert | 1.2 | yes | Manager, Executive | We have documented and mapped our key business processes to identify high-impact AI integration points. |
| 2 | `ops_automation_candidates` | likert | 1.3 | yes | all | We have identified tasks suitable for AI augmentation — including content generation, summarization, data analysis, and decision support. |
| 3 | `ops_change_readiness` | likert | 1.1 | yes | all | Our operational teams are trained to work alongside AI tools and are receptive to AI-enabled process changes. |
| 4 | `ops_priority_areas` | multiple | 1.0 | yes | Manager, Executive | Which operational area would benefit most from AI enhancement? |
| 5 | `ops_bottlenecks` | text | 1.0 | no | all | What specific operational processes or tasks would you most like to improve with AI? |

**Options for Q4** (multiple choice, single select):
- Customer service and support
- Content creation and marketing
- Financial operations and reporting
- Human resources and talent management
- Sales enablement and lead qualification
- Product development and innovation

**Placeholder for Q5**: "e.g., Report generation, customer inquiry routing, document summarization, data entry"

### Section 3: Technology Infrastructure
- **Section weight**: 1.1
- **Description**: Assess your technical readiness for AI deployment and integration

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `tech_infrastructure` | likert | 1.3 | yes | all | Our IT infrastructure supports AI workloads including API integrations with AI platforms, LLM providers, and cloud AI services. |
| 2 | `tech_cloud_experience` | likert | 1.1 | yes | all | We have experience deploying and managing cloud-based AI services, SaaS AI tools, or AI-enabled applications. |
| 3 | `tech_integration` | likert | 1.2 | yes | all | Our systems support secure data flows to and from AI services with proper access controls and audit trails. |
| 4 | `tech_security` | likert | 1.2 | yes | all | We have established criteria for evaluating, selecting, and governing AI tools — including data residency, model transparency, and vendor risk. |
| 5 | `tech_barriers` | text | 1.0 | no | all | What are your biggest technology concerns or gaps when it comes to implementing AI? |

**Placeholder for Q5**: "e.g., AI vendor lock-in, data security with LLMs, integration with legacy systems, lack of AI ops expertise"

### Section 4: Data Quality & Governance
- **Section weight**: 1.3
- **Description**: Evaluate your data readiness for AI applications and model integration

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `data_quality` | likert | 1.4 | yes | all | We have high-quality, well-structured data that can be used to provide context to AI models (e.g., for RAG, fine-tuning, or analytics). |
| 2 | `data_accessibility` | likert | 1.3 | yes | all | Our data is well-organized and accessible for use in AI applications, with appropriate permissions and search capabilities. |
| 3 | `data_governance` | likert | 1.2 | yes | Manager, Executive | We have data governance policies that address AI-specific concerns — including training data rights, model outputs, and intellectual property. |
| 4 | `data_collection` | likert | 1.1 | yes | all | We have clear data privacy frameworks that cover AI data processing and comply with current regulations (e.g., GDPR, state privacy laws, industry standards). |
| 5 | `data_challenges` | multiple | 1.2 | yes | all | What is your biggest data challenge for AI implementation? |

**Options for Q5** (multiple choice, single select):
- Poor data quality and inconsistencies
- Data scattered across disconnected systems
- Unclear data rights for AI training and processing
- Privacy, security, and compliance concerns with AI
- Limited ability to prepare data for AI consumption (e.g., RAG, embeddings)
- Inadequate data infrastructure for AI workloads

### Section 5: Organizational Culture
- **Section weight**: 1.0
- **Description**: Assess cultural readiness for AI adoption and workforce transformation

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `culture_enthusiasm` | likert | 1.2 | yes | all | Our employees actively use AI tools in their daily work and are open to expanding AI adoption across the organization. |
| 2 | `culture_change_embrace` | likert | 1.1 | yes | all | Teams adapt quickly to new AI capabilities, share best practices, and embrace AI-driven changes to their workflows. |
| 3 | `culture_upskilling` | likert | 1.3 | yes | Manager, Executive | Our organization invests in AI literacy training and skill development for employees at all levels. |
| 4 | `culture_collaboration` | likert | 1.0 | yes | all | Technical and business teams collaborate effectively to identify high-value AI opportunities and bring solutions to production. |
| 5 | `culture_value_concerns` | text | 1.0 | no | all | What do you see as the biggest cultural opportunity or barrier to AI adoption in your organization? |

**Placeholder for Q5**: "e.g., Employees excited to learn AI tools, concerns about job displacement, need for change management"

### Section 6: AI-Powered Automation
- **Section weight**: 0.9
- **Description**: Evaluate current AI automation capabilities and opportunities

| # | ID | Type | Weight | Required | Roles | Question Text |
|---|-----|------|--------|----------|-------|--------------|
| 1 | `auto_current_state` | likert | 1.1 | yes | all | We have implemented AI-powered automation beyond basic rule-based workflows (e.g., intelligent document processing, AI assistants, or agent workflows). |
| 2 | `auto_employee_understanding` | likert | 1.2 | yes | all | Our employees understand how AI augments their work and can proactively identify new automation opportunities. |
| 3 | `auto_hands_on_experience` | likert | 1.2 | yes | all | We have hands-on experience with modern AI automation tools — such as AI coding assistants, AI agents, or AI-integrated business platforms. |
| 4 | `auto_measurement` | likert | 1.0 | yes | Manager, Executive | We track and demonstrate ROI from AI-powered automation initiatives with clear metrics (time saved, error reduction, cost impact). |
| 5 | `auto_specific_tasks` | text | 1.0 | no | all | What would be your ideal next AI automation project or use case? |

**Placeholder for Q5**: "e.g., AI-powered customer support, automated report generation, intelligent document review, AI coding assistant"

### Question Filtering by Role
When a question has `roles: ["Manager", "Executive"]`, it is **still shown to all users** but is weighted differently:
- If the respondent's role matches, the question weight is used as-is
- If the respondent's role does NOT match, use weight of 1.0 (baseline) instead of the specified weight
- This means all respondents answer all questions, but role-specific questions carry more weight for the appropriate roles

### Important: Multiple Choice Questions Are NOT Scored
Questions with `type: "multiple"` (ops_priority_areas, data_challenges) are **informational only** — they do not contribute to the section score. They provide qualitative context for insights and HubSpot notes. Only `type: "likert"` questions are scored.

---

## 5. Scoring Engine

### Individual Section Score
For each section, calculate the score using only Likert-type questions:

```
section_score = round(
  sum(answer_value / 4 * 100) / count_of_likert_questions
)
```

Where `answer_value` is 0-4 (the Likert scale index).

This produces a score from 0 to 100 per section.

**Note on weights**: The current implementation does a simple average — question weights and section weights exist in the data model but are NOT currently used in the score calculation. The rebuild should support weighted scoring as a configuration option but default to simple averaging for consistency with existing results.

### Overall Score
Simple average of all 6 section scores:

```
overall_score = round(
  (strategy + operations + technology + data + culture + automation) / 6
)
```

### Readiness Levels
| Score Range | Level | Color |
|-------------|-------|-------|
| 80-100 | Advanced | Green (`text-green-600`) |
| 60-79 | Intermediate | Blue (`text-blue-600`) |
| 40-59 | Developing | Yellow (`text-yellow-600`) |
| 0-39 | Beginning | Red (`text-red-600`) |

### Organization Aggregate Score (NEW)
For each section, the organization score is the **average of all respondent scores** for that section:

```
org_section_score = round(
  sum(respondent_section_scores) / count_of_respondents
)
```

Additionally, calculate:
- **Score spread** (min, max, standard deviation) per section — reveals alignment or divergence
- **Score by role level** — averages broken out by Executive, Manager, Individual Contributor
- **Response count** — how many people have completed

---

## 6. Results & Insights Logic

### Individual Results Page

#### Insights Generation Rules
Insights are generated dynamically based on scores. Apply these rules **in order**:

1. **Strength insight** — Find sections scoring >= 70, pick the highest:
   - Title: `"{Section} is Your Strong Foundation"`
   - Description: `"Your {section} readiness score of {score}% represents a solid foundation. This strength can be leveraged to accelerate AI adoption across other domains."`

2. **Critical weakness** — Find sections scoring < 25, pick the lowest:
   - Title: `"{Section} Requires Immediate Attention"`
   - Description: `"Your {section} score of {score}% indicates a critical gap that needs strengthening before successful AI implementation."`
   - Include CTA link to consultation: `https://calendly.com/robvoss-vossaiconsulting/30min`

3. **Regular weakness** (if no critical weakness) — Find sections scoring < 50, pick the lowest:
   - Title: `"{Section} Needs Strengthening"`
   - Description: `"Your {section} score of {score}% suggests this area requires focused improvement to support AI success."`
   - Include CTA link to consultation

4. **Overall insight** — Based on overall score:
   - >= 70: "Well-Positioned for AI Success"
   - 50-69: "Solid Foundation with Growth Areas"
   - 25-49: "Foundational Development Needed" (include consultation CTA)
   - < 25: "Starting Your AI Journey" (include consultation CTA)

#### Action Plan Generation Rules
Generate action items based on section scores. For each section scoring < 70:

**Strategy < 70**:
- Immediate (0-30 days): "Define a clear AI strategy tied to specific business objectives"
- Short-term (30-90 days): "Establish an AI governance framework covering ethics, risk, and responsible use"

**Data < 70**:
- Immediate: "Audit data quality and accessibility for AI readiness (RAG, analytics, fine-tuning)"
- Short-term: "Implement data governance policies addressing AI-specific concerns (IP, training data rights)"

**Technology < 70**:
- Short-term: "Evaluate and adopt cloud-based AI platforms and LLM providers"
- Long-term: "Build secure AI integration architecture with proper access controls and audit trails"

**Culture < 70**:
- Immediate: "Launch AI literacy training for employees at all levels"
- Short-term: "Create cross-functional AI champions program to drive adoption"

**Automation < 70**:
- Immediate: "Identify high-value tasks for AI augmentation (summarization, content generation, analysis)"
- Short-term: "Pilot AI automation tools such as AI assistants, coding copilots, or agent workflows"

**If all sections >= 70** (defaults):
- Immediate: "Identify next wave of AI use cases across departments" + "Formalize AI governance and responsible use policies"
- Short-term: "Scale successful AI implementations with clear ROI metrics" + "Explore AI agent workflows for complex multi-step processes"
- Long-term: "Build an AI center of excellence to accelerate enterprise-wide adoption" + "Develop custom AI solutions and fine-tuned models for competitive advantage"

### Radar Chart
Display a radar/spider chart with 6 axes: Strategy, Operations, Technology, Data, Culture, Automation. Scale 0-100. Use Chart.js (already a dependency).

---

## 7. Organization Dashboard (NEW)

This is the major new feature. Accessible only to the org admin.

### Dashboard Sections

#### 1. Overview Card
- Organization name, industry, size
- Total respondents (completed / invited)
- Overall org readiness score (aggregate)
- Org readiness level badge

#### 2. Aggregate Radar Chart
- Same 6-axis radar chart but showing the org average
- Optionally overlay the admin's individual scores for comparison

#### 3. Section Score Cards (6 cards)
For each section show:
- Org average score
- Min / Max range
- Number of respondents
- A visual indicator of alignment (tight range = aligned, wide range = divergent)

#### 4. Role Perspective Comparison
A table or grouped bar chart showing average scores broken out by role level:

| Section | Executive Avg | Manager Avg | IC Avg | Spread |
|---------|--------------|-------------|--------|--------|
| Strategy | 78 | 65 | 52 | 26 |
| ... | ... | ... | ... | ... |

Large spreads (> 20 points) should be flagged visually — these indicate perception gaps.

#### 5. Response List
A table of respondents:
- Name, role level, completion date, overall score
- Click to see their individual section scores (not their answers — privacy)

#### 6. Invite Team Section
- Display the invite link with copy button
- Optionally: email input to send invite directly

#### 7. Free-Text Response Summary
Aggregate all open-ended responses by section. Display them anonymously (or attributed, configurable). This gives the admin qualitative context alongside the quantitative scores.

---

## 8. Data Model & Schema

### Tables

#### `organizations` (NEW)
```sql
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,  -- short code for invite links
    admin_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_organizations_invite_code ON organizations(invite_code);
```

#### `users`
```sql
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(255),
    role_level VARCHAR(50),  -- 'Executive', 'Manager', 'Individual Contributor'
    phone VARCHAR(50),
    organization_id UUID REFERENCES organizations(id),  -- NEW: links user to org
    is_org_admin BOOLEAN DEFAULT false,                  -- NEW: admin flag
    consent_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `assessments`
```sql
CREATE TABLE assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),   -- NEW: direct org link
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_progress',            -- 'in_progress', 'completed', 'abandoned'
    answers JSONB DEFAULT '{}'::jsonb,                    -- { question_id: answer_value }
    score DECIMAL(5,2),                                  -- overall score
    section_scores JSONB,                                -- { strategy: 75, operations: 68, ... }
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_organization_id ON assessments(organization_id);
CREATE INDEX idx_assessments_status ON assessments(status);
```

#### `questions` (optional — can be loaded from JSON file instead)
```sql
CREATE TABLE questions (
    id VARCHAR(100) PRIMARY KEY,
    section_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,                           -- 'likert', 'multiple', 'text'
    question TEXT NOT NULL,
    options JSONB,
    weight DECIMAL(3,2) DEFAULT 1.0,
    required BOOLEAN DEFAULT false,
    roles JSONB DEFAULT '["all"]'::jsonb,
    help_text TEXT,
    placeholder TEXT,
    order_index INTEGER DEFAULT 0
);
```

#### `benchmarks`
```sql
CREATE TABLE benchmarks (
    id VARCHAR(50) PRIMARY KEY,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    strategy_avg DECIMAL(5,2),
    operations_avg DECIMAL(5,2),
    technology_avg DECIMAL(5,2),
    data_avg DECIMAL(5,2),
    culture_avg DECIMAL(5,2),
    automation_avg DECIMAL(5,2),
    sample_size INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Relationships
```
organizations 1 ──── * users
organizations 1 ──── * assessments
users         1 ──── * assessments
organizations.admin_user_id ──── 1 users
```

---

## 9. API Endpoints

### Organization Endpoints (NEW)

#### `POST /api/organizations`
Create a new organization and its admin user.

**Request body**:
```json
{
    "orgName": "Acme Corp",
    "industry": "Technology",
    "companySize": "51-200",
    "admin": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@acme.com",
        "jobTitle": "CTO",
        "roleLevel": "Executive",
        "consentMarketing": true
    }
}
```

**Response**:
```json
{
    "success": true,
    "organizationId": "uuid",
    "inviteCode": "abc123",
    "inviteLink": "https://assessment.example.com/org/abc123",
    "sessionId": "session-id"
}
```

#### `GET /api/organizations/:inviteCode`
Get organization info for the invite landing page.

**Response**:
```json
{
    "orgName": "Acme Corp",
    "industry": "Technology",
    "adminFirstName": "Jane"
}
```

#### `GET /api/organizations/:inviteCode/dashboard`
Get the organization dashboard data. **Requires authentication as org admin.**

**Response**:
```json
{
    "organization": { "name": "Acme Corp", "industry": "Technology", "companySize": "51-200" },
    "totalRespondents": 12,
    "aggregateScores": {
        "strategy": 68, "operations": 72, "technology": 65,
        "data": 58, "culture": 74, "automation": 61,
        "overall": 66
    },
    "scoresByRole": {
        "Executive": { "strategy": 78, "operations": 75, ... },
        "Manager": { "strategy": 65, "operations": 70, ... },
        "Individual Contributor": { "strategy": 55, "operations": 68, ... }
    },
    "scoreRanges": {
        "strategy": { "min": 42, "max": 88, "stdDev": 12.3 },
        ...
    },
    "respondents": [
        { "name": "Jane Smith", "roleLevel": "Executive", "overallScore": 78, "completedAt": "2026-02-15T..." },
        ...
    ],
    "freeResponses": {
        "strategy_obstacles": ["Response 1", "Response 2", ...],
        "ops_bottlenecks": [...],
        ...
    },
    "readinessLevel": "Intermediate"
}
```

### User Endpoints

#### `POST /api/users`
Register a user (either as org admin during org creation, or as invited team member).

**Request body**:
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@acme.com",
    "jobTitle": "Data Analyst",
    "roleLevel": "Individual Contributor",
    "organizationInviteCode": "abc123",
    "consentMarketing": true
}
```

### Assessment Endpoints

#### `POST /api/assessment/save`
Save in-progress assessment answers. Called on each section advance.

**Request body**:
```json
{
    "answers": { "strategy_vision": 3, "strategy_problems": 2, ... },
    "currentSection": 2
}
```

#### `POST /api/assessment/complete`
Submit the completed assessment. Triggers scoring, Supabase save, Redis cache, and HubSpot integration.

**Request body**:
```json
{
    "answers": { ... },
    "freeResponses": {
        "strategy_obstacles": "Our biggest challenge is...",
        "ops_bottlenecks": "Report generation takes...",
        "tech_barriers": "Legacy system integration...",
        "data_challenges": "Data scattered across...",
        "culture_value_concerns": "Employees excited but...",
        "auto_specific_tasks": "Customer support automation..."
    }
}
```

**Response** (server calculates scores):
```json
{
    "success": true,
    "score": 68,
    "sectionScores": { "strategy": 72, "operations": 65, ... },
    "readinessLevel": "Intermediate",
    "insights": [...],
    "actionPlan": {...}
}
```

**Important**: The server should calculate scores — not the client. The client currently calculates scores in JavaScript and sends them to the server, which just stores them. The rebuild should move score calculation server-side so there is ONE source of truth. The client sends raw answers; the server returns computed scores.

#### `GET /api/questions`
Return the question bank. Optionally filtered by industry/role.

#### `GET /api/benchmarks?industry=Technology&companySize=51-200`
Return benchmark data for comparison.

#### `GET /health`
Health check endpoint showing status of Redis, Supabase, HubSpot connections.

---

## 10. Integrations

### Supabase (Database)
- **Purpose**: Persistent storage for all data
- **Required env vars**: `SUPABASE_URL`, `SUPABASE_API_KEY`
- **Behavior when unavailable**: Log warning, continue with Redis-only (degraded mode)
- All assessment data, user data, and organization data lives here
- Use upsert on email for users (prevent duplicates)

### Redis (Cache & Sessions)
- **Purpose**: Session storage, rate limiting, response caching
- **Required env vars**: `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT` (+ optional `REDIS_PASSWORD`)
- **Behavior when unavailable**: Fall back to memory-based sessions and rate limiting
- **Cache keys and TTLs**:
  - `user:{sessionId}` — 24 hours
  - `assessment:{sessionId}` — 1 hour (in-progress answers)
  - `completed:{sessionId}` — 24 hours
  - `questions:{industry}:{role}` — 30 minutes
  - `benchmarks:{industry}:{companySize}` — 1 hour
  - `org-dashboard:{orgId}` — 5 minutes (NEW — dashboard cache, short TTL)

### HubSpot CRM
- **Purpose**: Lead generation and sales pipeline
- **Required env vars**: `HUBSPOT_ACCESS_TOKEN`
- **Behavior when unavailable**: Log warning, skip CRM integration entirely, assessment still works
- **Triggered on**: Assessment completion only

#### HubSpot Contact Properties Created
Standard properties:
- `email`, `firstname`, `lastname`, `company`, `jobtitle`, `phone`, `industry`

Custom properties (must be created in HubSpot first):
- `ai_readiness_score` (string) — overall score
- `ai_assessment_completed_date` (string) — YYYY-MM-DD
- `company_size` (string)
- `ai_strategy_score` (string)
- `ai_data_score` (string)
- `ai_technology_score` (string)
- `ai_culture_score` (string)
- `ai_automation_score` (string)
- `lead_source` (string) — always "AI Readiness Assessment"

#### HubSpot Deal Creation
Created for **every** completed assessment:

| Field | Value |
|-------|-------|
| `dealname` | `"AI Assessment - {company} ({Qualified\|Unqualified})"` |
| `pipeline` | From env `HUBSPOT_PIPELINE_ID` or `"default"` |
| `dealstage` | Qualified: env `HUBSPOT_QUALIFIED_STAGE` or `"appointmentscheduled"`. Unqualified: env `HUBSPOT_UNQUALIFIED_STAGE` or `"unqualified"` |
| `amount` | Calculated (see below) |
| `closedate` | 30 days from now (YYYY-MM-DD) |
| `ai_readiness_score` | Score value |
| `lead_source` | `"AI Readiness Assessment"` |

**Deal qualification**: Score >= 70 → qualified; Score < 70 → unqualified

**Deal value calculation**:
```
Base values by company size:
  "1-10":     $25,000
  "11-50":    $25,000
  "51-200":   $75,000
  "201-1000": $150,000
  "1000+":    $300,000

Score multiplier:
  Score > 80: 1.3x
  Score > 60: 1.1x
  Score <= 60: 1.0x

deal_amount = base_value * score_multiplier
```

#### HubSpot Note
Attached to the contact after assessment completion. Contains:
- Overall score
- Key insights (generated by `generateKeyInsights()`)
- All free-text responses labeled by section

---

## 11. Frontend Architecture

### Current Problems to Fix
1. **No bundler** — 11 separate JS files loaded as script tags. Use Vite or esbuild.
2. **Questions hardcoded in 3 places** — `coreQuestions.json`, `assessment-clean.js` (lines 25-98), and `results.js` (lines 72-80). Use ONE source: load from API.
3. **Score calculation duplicated** — exists in both `assessment-clean.js` and `results.js`. Move to server-side only.
4. **API URL hardcoded** — `localhost:3001` and `api.vossaiconsulting.com` scattered through client code. Use one configurable constant.
5. **`sendToGoogleSheets()` is a duplicate** — It's identical to `sendToWebhook()`. Remove it.
6. **No error recovery** — If the API call fails on the results page, data is lost (only localStorage backup). Add retry logic.
7. **`safeLocalStorage()` duplicated** — Defined identically in 3 files. Extract to shared module.

### Pages (Rebuild)

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Marketing page, "Start Assessment" CTA |
| Org Setup | `/start` | Create organization + admin info form |
| Invite Landing | `/org/:inviteCode` | Shows org name, collects team member info |
| Assessment | `/assessment` | 6-section assessment flow |
| Results | `/results` | Individual results display |
| Org Dashboard | `/dashboard/:inviteCode` | Admin-only org dashboard |
| Privacy Policy | `/privacy` | Static legal page |
| Terms of Service | `/terms` | Static legal page |

### UI Framework
Current: Tailwind CSS via CDN + custom CSS file. Recommended: Keep Tailwind but install it properly via npm (not CDN) for build-time purging and smaller bundles.

### Chart Library
Chart.js — already used for the radar chart. Keep it.

### CSS Design
Mobile-first responsive design. The existing design system uses:
- Blue primary color (`blue-600` / `blue-800`)
- Clean card-based layouts with shadows
- Progress bars with percentage labels
- Likert buttons as a horizontal row (1-5) with labels underneath

---

## 12. Configuration & Environment

### All Environment Variables

```bash
# === REQUIRED ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-service-role-key
SESSION_SECRET=generate-a-64-char-hex-string

# === RECOMMENDED ===
REDIS_URL=redis://localhost:6379          # or REDIS_HOST + REDIS_PORT + REDIS_PASSWORD
NODE_ENV=production                        # or development
PORT=3001
FRONTEND_URL=https://your-domain.com      # for CORS

# === OPTIONAL — HubSpot CRM ===
HUBSPOT_ACCESS_TOKEN=your-token            # omit to disable CRM integration entirely
HUBSPOT_PIPELINE_ID=default
HUBSPOT_QUALIFIED_STAGE=appointmentscheduled
HUBSPOT_UNQUALIFIED_STAGE=unqualified

# === OPTIONAL — Business Rules ===
HUBSPOT_DEAL_THRESHOLD=70                 # score threshold for qualified vs unqualified
CONSULTATION_URL=https://calendly.com/robvoss-vossaiconsulting/30min

# === OPTIONAL — Analytics ===
GA_TRACKING_ID=G-XXXXXXXXXX
```

### Startup Validation
On server start, validate required env vars and fail fast with a clear message:

```
FATAL: Missing required environment variable SUPABASE_URL
FATAL: Missing required environment variable SESSION_SECRET
```

Warn (but don't fail) for optional services:
```
WARN: HUBSPOT_ACCESS_TOKEN not set — CRM integration disabled
WARN: REDIS_URL not set — using memory-based sessions (not suitable for production)
```

### Config Module
Create a `config.js` that reads all env vars once at startup, applies defaults, and exports a frozen config object. All other code imports from config — never reads `process.env` directly. This is the single place to change any threshold, URL, or business rule.

```javascript
// Example structure
module.exports = Object.freeze({
    port: Number(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    supabase: {
        url: process.env.SUPABASE_URL,       // required
        apiKey: process.env.SUPABASE_API_KEY  // required
    },
    redis: {
        url: process.env.REDIS_URL || null,
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null
    },
    hubspot: {
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN || null,
        pipelineId: process.env.HUBSPOT_PIPELINE_ID || 'default',
        qualifiedStage: process.env.HUBSPOT_QUALIFIED_STAGE || 'appointmentscheduled',
        unqualifiedStage: process.env.HUBSPOT_UNQUALIFIED_STAGE || 'unqualified',
        dealThreshold: Number(process.env.HUBSPOT_DEAL_THRESHOLD) || 70
    },
    scoring: {
        qualifiedThreshold: 70,
        insightThresholds: {
            strength: 70,
            weakness: 50,
            critical: 25
        },
        readinessLevels: [
            { min: 80, label: 'Advanced', color: 'green' },
            { min: 60, label: 'Intermediate', color: 'blue' },
            { min: 40, label: 'Developing', color: 'yellow' },
            { min: 0, label: 'Beginning', color: 'red' }
        ]
    },
    consultationUrl: process.env.CONSULTATION_URL || 'https://calendly.com/robvoss-vossaiconsulting/30min',
    session: {
        secret: process.env.SESSION_SECRET,  // required in production
        maxAge: 24 * 60 * 60 * 1000          // 24 hours
    }
});
```

---

## 13. Deployment

### Docker (Recommended)
The app should be deployable with a single `docker compose up`.

**Services**:
- `app` — Node.js backend (serves API + static frontend)
- `redis` — Redis for sessions and caching

Supabase is external (hosted at supabase.co) — not part of the Docker stack.

**Dockerfile** (keep it simple):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
USER node
HEALTHCHECK CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
services:
  app:
    build: .
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Without Docker
```bash
npm install
# Set up .env
node server.js
```

### Static Frontend + Separate Backend
For Netlify/Vercel frontend with API backend on Railway/DigitalOcean:
- Frontend: Serve the `client/` directory as static files
- Backend: Deploy the Node.js app separately
- Set `FRONTEND_URL` to the static site URL for CORS
- Frontend uses env-injected API base URL

---

## 14. Current Problems to Fix

These are specific bugs and debt in the existing codebase. Fix all of them in the rebuild.

### P1: Duplicate completion endpoints
`/api/assessment/complete` (server.js:264) and `/api/results` (server.js:587) do nearly identical work — Supabase save, Redis cache, HubSpot integration. The client calls `/api/results` from the results page. **Fix**: One endpoint only. `/api/assessment/complete`. Remove `/api/results`.

### P2: Client-side score calculation
Scores are calculated in `assessment-clean.js` (line 261-272) and again reconstructed in `results.js` (line 72-101). The server at `/api/results` just stores whatever the client sends. **Fix**: Client sends raw answers to `/api/assessment/complete`. Server calculates scores and returns them. Client displays what the server returns.

### P3: Questions defined in 3 places
- `coreQuestions.json` (authoritative)
- `assessment-clean.js` lines 25-98 (hardcoded duplicate, slightly different field names)
- `results.js` lines 72-80 (hardcoded question IDs for score reconstruction)

**Fix**: One source of truth. Load questions from the API. Client renders whatever the API returns.

### P4: Hardcoded API URLs
`results.js` and `user-info.js` both contain:
```javascript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://api.vossaiconsulting.com/api';
```
This is duplicated in multiple files and hardcodes the production URL. **Fix**: Single API config module. In production, use relative URLs (`/api/...`) when frontend and backend are served from the same origin, or inject the API URL at build time.

### P5: No env validation
If `SUPABASE_URL` is missing, the app starts but silently fails on every DB operation. **Fix**: Validate required env vars on startup. Fail fast.

### P6: Monolithic server.js
780 lines with all routes, middleware, and helper functions in one file. **Fix**: Split into:
- `server.js` — app setup, middleware, start
- `routes/assessment.js` — assessment CRUD
- `routes/organizations.js` — org management (NEW)
- `routes/users.js` — user registration
- `routes/analytics.js` — dashboard data
- `config.js` — centralized configuration
- `utils/scoring.js` — score calculation (NEW — single source of truth)
- `utils/insights.js` — insight generation logic
- `utils/supabase.js` — database client
- `utils/redis.js` — cache client
- `utils/hubspot.js` — CRM client

### P7: HubSpot field name mismatch
In `hubspot.js` line 50, the code references `sectionScores?.talent` but the assessment has no "talent" section. It should be `sectionScores?.operations`. Similarly, `ai_governance_score` maps to the "automation" section. **Fix**: Use consistent naming. Map section IDs directly.

### P8: `safeLocalStorage()` repeated 3 times
Identical function in `assessment-clean.js`, `results.js`, and `user-info.js`. **Fix**: One shared utility module.

### P9: No tests
Zero test coverage. **Fix**: Add at minimum:
- Scoring engine unit tests (given answers, verify scores)
- API endpoint integration tests (health, questions, assessment save/complete)
- Organization invite code generation test

---

## 15. Tech Stack Decisions

### Keep
- **Node.js + Express** — Backend
- **Supabase** — Database (PostgreSQL)
- **Redis** — Caching and sessions
- **Chart.js** — Radar chart visualization
- **Tailwind CSS** — Styling (but install properly, not CDN)
- **HubSpot API client** — CRM integration

### Add
- **Vite** — Frontend bundler (fast, simple config, replaces the need for 11 separate script tags)
- **A test framework** — Vitest (pairs well with Vite) or Jest
- **nanoid** — For generating invite codes (short, URL-safe, unique)

### Remove
- Google Sheets integration (dead code — `sendToGoogleSheets` is just a duplicate of the primary API call)
- `QuestionManager.js` (420 lines, not integrated into the actual flow)
- `industryModules.json` (identical to `coreQuestions.json` — dead file)
- `security-monitor.js` (client-side security monitoring — not used)
- Duplicate HTML pages (`landing.html` vs `index.html` — pick one)

### File Structure (Recommended)

```
/
├── server.js                    # Express app setup + start
├── config.js                    # All env vars + defaults
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── data/
│   └── questions.json           # Single source of truth for questions
├── routes/
│   ├── assessment.js
│   ├── organizations.js
│   ├── users.js
│   └── analytics.js
├── utils/
│   ├── scoring.js               # Score calculation
│   ├── insights.js              # Insight + action plan generation
│   ├── supabase.js
│   ├── redis.js
│   └── hubspot.js
├── middleware/
│   ├── auth.js                  # Org admin authentication
│   └── validation.js            # Input validation
├── database/
│   └── schema.sql               # Full schema with organizations table
├── client/                      # Frontend (built with Vite)
│   ├── index.html               # Landing
│   ├── start.html               # Org setup
│   ├── invite.html              # Team member landing
│   ├── assessment.html          # Assessment flow
│   ├── results.html             # Individual results
│   ├── dashboard.html           # Org dashboard
│   ├── scripts/
│   │   ├── main.js              # Shared config + utilities
│   │   ├── assessment.js        # Assessment logic
│   │   ├── results.js           # Results display
│   │   ├── dashboard.js         # Org dashboard
│   │   └── api.js               # API client (single fetch wrapper)
│   └── styles/
│       └── main.css             # Tailwind + custom styles
└── tests/
    ├── scoring.test.js
    ├── api.test.js
    └── organizations.test.js
```

---

## Summary for the Builder

1. **Read `data/questions.json`** as the single source of truth for all questions, weights, and options
2. **Score calculation lives on the server only** — client sends raw answers, server returns scores
3. **Organizations are the new core concept** — every assessment belongs to an org, every user belongs to an org
4. **The invite link flow is critical** — admin creates org → gets link → shares with team → team members arrive at pre-filled landing
5. **The org dashboard is the key new feature** — aggregate scores, role-based breakdowns, alignment analysis
6. **HubSpot integration fires on every completion** — contact + deal + note, qualified/unqualified based on score threshold
7. **Config is centralized** — one `config.js`, one `.env`, all thresholds and business rules configurable without code changes
8. **Deploy with `docker compose up`** — that's the target simplicity
9. **Fix all P1-P9 problems** — no duplicate endpoints, no client-side scoring, no hardcoded URLs, no repeated utility functions
