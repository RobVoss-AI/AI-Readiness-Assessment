// server.js — Phase 1 backend: server-side scoring, Supabase persistence, graceful degradation
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');

const config = require('./assessment-config');
const redisClient = require('./utils/redis');
const supabaseClient = require('./utils/supabase');
const hubspotClient = require('./utils/hubspot');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Initialise external services (all optional — app works without them)
// ---------------------------------------------------------------------------
async function initConnections() {
  // Redis
  try {
    await redisClient.connect();
    if (redisClient.isConnected) console.log('[redis] connected');
  } catch (e) {
    console.log('[redis] unavailable —', e.message);
  }

  // Supabase
  try {
    await supabaseClient.initialize();
    if (supabaseClient.isConnected) console.log('[supabase] connected');
  } catch (e) {
    console.log('[supabase] unavailable —', e.message);
  }

  // HubSpot
  try {
    hubspotClient.initialize();
    if (hubspotClient.isConnected) console.log('[hubspot] connected');
  } catch (e) {
    console.log('[hubspot] unavailable —', e.message);
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
function setupMiddleware() {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  }));

  app.use(express.json({ limit: '1mb' }));

  // Rate limiting (memory-backed — Redis optional)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);

  // Serve the client SPA
  app.use(express.static(path.join(__dirname, 'client')));
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------
function sanitize(str, maxLen = 5000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
function setupRoutes() {

  // ---- Health check ---------------------------------------------------------
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisClient.isConnected ? 'healthy' : 'unavailable',
        supabase: supabaseClient.isConnected ? 'healthy' : 'unavailable',
        hubspot: hubspotClient.isConnected ? 'healthy' : 'unavailable'
      }
    });
  });

  // ---- Assessment config (no weights exposed) ------------------------------
  app.get('/api/assessment/config', (_req, res) => {
    res.json(config.getClientConfig());
  });

  // ---- Start assessment (email capture) ------------------------------------
  app.post('/api/assessment/start', async (req, res) => {
    try {
      const email = sanitize(req.body.email, 255);
      const name = sanitize(req.body.name || '', 200);
      const company = sanitize(req.body.company || '', 200);

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const sessionId = crypto.randomUUID();

      const sessionData = { email, name, company, startedAt: new Date().toISOString() };

      // Cache in Redis
      await redisClient.setJSON(`session:${sessionId}`, sessionData, 86400);

      // Persist user to Supabase
      if (supabaseClient.isConnected) {
        try {
          await supabaseClient.client
            .from('users')
            .upsert({
              email,
              first_name: name.split(' ')[0] || '',
              last_name: name.split(' ').slice(1).join(' ') || '',
              company,
              created_at: new Date().toISOString()
            }, { onConflict: 'email' });
        } catch (e) {
          console.warn('[supabase] user upsert failed:', e.message);
        }
      }

      res.json({ success: true, sessionId });
    } catch (error) {
      console.error('[start] error:', error);
      res.status(500).json({ error: 'Failed to start assessment.' });
    }
  });

  // ---- Submit assessment (server-side scoring) -----------------------------
  app.post('/api/assessment/submit', async (req, res) => {
    try {
      const { sessionId, answers } = req.body;

      if (!sessionId || typeof answers !== 'object') {
        return res.status(400).json({ error: 'sessionId and answers are required.' });
      }

      // Retrieve session data
      let session = await redisClient.getJSON(`session:${sessionId}`);
      if (!session) {
        // Allow submission even without a cached session (e.g. Redis was restarted)
        session = { email: 'unknown', name: '', company: '' };
      }

      // --- Server-side scoring ---
      const { overall, sections: sectionScores } = config.calculateScores(answers);
      const readinessLevel = config.getReadinessLevel(overall);
      const insights = config.generateInsights(sectionScores, overall);
      const freeResponses = config.extractFreeResponses(answers);

      const result = {
        overall,
        sections: sectionScores,
        readinessLevel,
        insights,
        freeResponses
      };

      // Cache result
      await redisClient.setJSON(`result:${sessionId}`, result, 86400);

      // --- Persist to Supabase ---
      let assessmentId = null;
      if (supabaseClient.isConnected) {
        try {
          // Look up user
          let userId = null;
          if (session.email && session.email !== 'unknown') {
            const { data: users } = await supabaseClient.client
              .from('users')
              .select('id')
              .eq('email', session.email);
            if (users && users.length > 0) userId = users[0].id;
          }

          const row = {
            session_id: sessionId,
            user_id: userId,
            email: session.email,
            answers,
            score: overall,
            section_scores: sectionScores,
            status: 'completed',
            completed_at: new Date().toISOString()
          };

          const saved = await supabaseClient.saveAssessment(row);
          assessmentId = saved?.id || null;
        } catch (e) {
          console.warn('[supabase] assessment save failed:', e.message);
        }
      }

      // --- HubSpot lead creation (optional) ---
      if (hubspotClient.isConnected && session.email && session.email !== 'unknown') {
        try {
          const userInfo = {
            email: session.email,
            firstName: (session.name || '').split(' ')[0],
            lastName: (session.name || '').split(' ').slice(1).join(' '),
            company: session.company
          };

          let contact = await hubspotClient.getContactByEmail(session.email);

          if (contact) {
            await hubspotClient.updateContactAssessment(session.email, assessmentId, {
              ai_readiness_score: overall.toString(),
              last_assessment_date: new Date().toISOString().split('T')[0]
            });
          } else {
            contact = await hubspotClient.createContactFromAssessment(
              answers, userInfo, overall, sectionScores
            );
          }

          if (contact) {
            const stage = overall >= 70 ? 'qualified' : 'unqualified';
            await hubspotClient.createDealFromAssessment(
              contact.id, answers, overall, userInfo, stage
            );

            const keyInsights = generateHubSpotInsights(sectionScores, overall);
            await hubspotClient.addAssessmentNote(contact.id, overall, keyInsights, freeResponses);
          }
        } catch (e) {
          console.warn('[hubspot] integration failed:', e.message);
        }
      }

      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[submit] error:', error);
      res.status(500).json({ error: 'Failed to score assessment.' });
    }
  });

  // ---- SPA catch-all -------------------------------------------------------
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  });

  // ---- Error handler -------------------------------------------------------
  app.use((err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Internal server error.' });
  });
}

// ---------------------------------------------------------------------------
// HubSpot insight helper (mirrors legacy generateKeyInsights)
// ---------------------------------------------------------------------------
function generateHubSpotInsights(sectionScores, overallScore) {
  const insights = [];

  if (overallScore >= 80) {
    insights.push('High AI readiness - excellent candidate for advanced AI implementation');
  } else if (overallScore >= 60) {
    insights.push('Moderate AI readiness - good foundation with areas for improvement');
  } else {
    insights.push('Early AI readiness stage - significant opportunity for consulting engagement');
  }

  const thresholds = {
    strategy: 70, operations: 65, technology: 65,
    data: 75, culture: 70, automation: 60
  };

  for (const [key, data] of Object.entries(sectionScores)) {
    const t = thresholds[key] || 65;
    if (data.score >= t) {
      insights.push(`Strong ${data.title} foundation (${data.score}/100)`);
    } else {
      insights.push(`${data.title} needs development (${data.score}/100) - consulting opportunity`);
    }
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function start() {
  try {
    await initConnections();
    setupMiddleware();
    setupRoutes();
    app.listen(PORT, () => {
      console.log(`[server] listening on :${PORT}`);
    });
  } catch (error) {
    console.error('[fatal]', error);
    process.exit(1);
  }
}

start();

module.exports = app;
