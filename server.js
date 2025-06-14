// server.js - Main backend server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const ConnectRedisStore = require('connect-redis').default;
const RateLimitRedisStore = require('rate-limit-redis').default;
const redisClient = require('./utils/redis');
const supabaseClient = require('./utils/supabase');
const hubspotClient = require('./utils/hubspot');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize connections
async function initializeConnections() {
    console.log('🔄 Connecting to Redis...');
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    
    console.log('🔄 Initializing Supabase...');
    supabaseClient.initialize();
    
    console.log('🔄 Initializing HubSpot...');
    hubspotClient.initialize();
    
    return { redisClient, supabaseClient };
}

// Setup middleware after Redis is connected
async function setupMiddleware() {
    // Basic middleware
    app.use(helmet());
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.static('public'));

    // Session management with Redis
    app.use(session({
        store: new ConnectRedisStore({ client: redisClient.client }),
        secret: process.env.SESSION_SECRET || 'ai-scorecard-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));

    // Redis-based rate limiting
    const limiter = rateLimit({
        store: new RateLimitRedisStore({
            sendCommand: (...args) => redisClient.client.sendCommand(args),
        }),
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);

    // Stricter rate limit for GPT endpoints
    const gptLimiter = rateLimit({
        store: new RateLimitRedisStore({
            sendCommand: (...args) => redisClient.client.sendCommand(args),
        }),
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // limit each IP to 10 GPT requests per hour
        standardHeaders: true,
        legacyHeaders: false,
    });

    return gptLimiter;
}

// Helper function to generate key insights for HubSpot notes
function generateKeyInsights(sectionScores, overallScore) {
    const insights = [];
    
    // Overall assessment
    if (overallScore >= 80) {
        insights.push('High AI readiness - excellent candidate for advanced AI implementation');
    } else if (overallScore >= 60) {
        insights.push('Moderate AI readiness - good foundation with areas for improvement');
    } else {
        insights.push('Early AI readiness stage - significant opportunity for consulting engagement');
    }
    
    // Section-specific insights
    const sections = [
        { key: 'strategy', name: 'AI Strategy', threshold: 70 },
        { key: 'data', name: 'Data Infrastructure', threshold: 75 },
        { key: 'technology', name: 'Technology', threshold: 65 },
        { key: 'talent', name: 'AI Talent', threshold: 60 },
        { key: 'culture', name: 'Culture', threshold: 70 },
        { key: 'governance', name: 'Governance', threshold: 65 }
    ];
    
    sections.forEach(section => {
        const score = sectionScores?.[section.key];
        if (score !== undefined) {
            if (score >= section.threshold) {
                insights.push(`Strong ${section.name} foundation (${score}/100)`);
            } else {
                insights.push(`${section.name} needs development (${score}/100) - consulting opportunity`);
            }
        }
    });
    
    return insights;
}

// Start server with Redis initialization
async function startServer() {
    try {
        // Step 1: Initialize connections
        await initializeConnections();
        
        // Step 2: Setup middleware after Redis is ready
        const gptLimiter = await setupMiddleware();
        
        // Step 3: Setup routes (they can use Redis now)
        setupRoutes(gptLimiter);
        
        // Step 4: Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Assessment API: http://localhost:${PORT}/api/assessment`);
            console.log(`📝 Session management: Redis-backed`);
            console.log(`⚡ Caching: Redis-enabled`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Setup routes function
function setupRoutes(gptLimiter) {
    // Assessment API routes with Supabase + Redis hybrid approach
    app.post('/api/assessment/save', async (req, res) => {
        try {
            const { assessmentData, userInfo } = req.body;
            const sessionId = req.sessionID;
            
            // Save to Redis for fast access (temporary cache)
            await redisClient.setJSON(`assessment:${sessionId}`, assessmentData, 3600);
            
            // Also save/update in Supabase for persistence
            if (supabaseClient.isConnected) {
                try {
                    // Try to find existing assessment
                    const existingAssessment = await supabaseClient.client
                        .from('assessments')
                        .select('id')
                        .eq('session_id', sessionId)
                        .single();
                    
                    if (existingAssessment.data) {
                        // Update existing
                        await supabaseClient.updateAssessment(existingAssessment.data.id, {
                            answers: assessmentData,
                            updated_at: new Date().toISOString()
                        });
                    } else {
                        // Create new
                        await supabaseClient.saveAssessment({
                            session_id: sessionId,
                            answers: assessmentData,
                            email: userInfo?.email,
                            industry: userInfo?.industry,
                            company_size: userInfo?.companySize,
                            status: 'in_progress'
                        });
                    }
                } catch (supabaseError) {
                    console.warn('Supabase save failed, continuing with Redis only:', supabaseError.message);
                }
            }
            
            res.json({ success: true, sessionId });
        } catch (error) {
            console.error('Assessment save error:', error);
            res.status(500).json({ error: 'Failed to save assessment' });
        }
    });

    app.get('/api/assessment/load/:sessionId?', async (req, res) => {
        try {
            const sessionId = req.params.sessionId || req.sessionID;
            
            // Try Redis first (fastest)
            let assessmentData = await redisClient.getJSON(`assessment:${sessionId}`);
            
            // If not in Redis, try Supabase
            if (!assessmentData && supabaseClient.isConnected) {
                try {
                    const supabaseData = await supabaseClient.client
                        .from('assessments')
                        .select('answers, status')
                        .eq('session_id', sessionId)
                        .single();
                    
                    if (supabaseData.data) {
                        assessmentData = supabaseData.data.answers;
                        // Re-cache in Redis for future requests
                        await redisClient.setJSON(`assessment:${sessionId}`, assessmentData, 3600);
                    }
                } catch (supabaseError) {
                    console.warn('Supabase load failed:', supabaseError.message);
                }
            }
            
            res.json({ assessmentData: assessmentData || null });
        } catch (error) {
            console.error('Assessment load error:', error);
            res.status(500).json({ error: 'Failed to load assessment' });
        }
    });

    app.post('/api/assessment/complete', async (req, res) => {
        try {
            const { assessmentData, userInfo, score, sectionScores } = req.body;
            const sessionId = req.sessionID;
            
            // Cache completed assessment in Redis
            const completedData = {
                assessmentData,
                userInfo,
                score,
                sectionScores,
                completedAt: new Date().toISOString()
            };
            await redisClient.setJSON(`completed:${sessionId}`, completedData, 86400);
            
            let assessmentId = null;
            
            // Save to Supabase for permanent storage
            if (supabaseClient.isConnected) {
                try {
                    // Find existing assessment or create new
                    const existingAssessment = await supabaseClient.client
                        .from('assessments')
                        .select('id')
                        .eq('session_id', sessionId)
                        .single();
                    
                    const updateData = {
                        answers: assessmentData,
                        score: score,
                        section_scores: sectionScores,
                        email: userInfo?.email,
                        industry: userInfo?.industry,
                        company_size: userInfo?.companySize,
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    };
                    
                    if (existingAssessment.data) {
                        const updated = await supabaseClient.updateAssessment(existingAssessment.data.id, updateData);
                        assessmentId = existingAssessment.data.id;
                    } else {
                        const created = await supabaseClient.saveAssessment({
                            session_id: sessionId,
                            ...updateData
                        });
                        assessmentId = created?.id;
                    }
                } catch (supabaseError) {
                    console.warn('Supabase completion save failed:', supabaseError.message);
                }
            }
            
            // Create HubSpot lead if email provided and HubSpot connected
            let hubspotContact = null;
            let hubspotDeal = null;
            
            if (hubspotClient.isConnected && userInfo?.email) {
                try {
                    // Check if contact already exists
                    const existingContact = await hubspotClient.getContactByEmail(userInfo.email);
                    
                    if (existingContact) {
                        // Update existing contact with new assessment data
                        hubspotContact = await hubspotClient.updateContactAssessment(
                            userInfo.email, 
                            assessmentId, 
                            {
                                ai_readiness_score: score.toString(),
                                last_assessment_date: new Date().toISOString().split('T')[0]
                            }
                        );
                        console.log('📊 Updated existing HubSpot contact');
                    } else {
                        // Create new contact
                        hubspotContact = await hubspotClient.createContactFromAssessment(
                            assessmentData, 
                            userInfo, 
                            score, 
                            sectionScores
                        );
                        console.log('🎯 Created new HubSpot contact');
                    }
                    
                    // Create deal for high-scoring assessments
                    if (hubspotContact && score >= 70) {
                        hubspotDeal = await hubspotClient.createDealFromAssessment(
                            hubspotContact.id, 
                            assessmentData, 
                            score, 
                            userInfo
                        );
                        
                        if (hubspotDeal) {
                            console.log('💰 Created HubSpot deal for high-scoring assessment');
                        }
                    }
                    
                    // Add assessment insights as note with free responses
                    if (hubspotContact) {
                        const keyInsights = generateKeyInsights(sectionScores, score);
                        // Extract free responses from assessment data
                        const freeResponses = assessmentData?.freeResponses || {};
                        await hubspotClient.addAssessmentNote(hubspotContact.id, score, keyInsights, freeResponses);
                    }
                    
                } catch (hubspotError) {
                    console.warn('HubSpot integration failed:', hubspotError.message);
                }
            }
            
            res.json({ 
                success: true, 
                sessionId, 
                score, 
                sectionScores,
                hubspot: {
                    contactCreated: !!hubspotContact,
                    dealCreated: !!hubspotDeal,
                    contactId: hubspotContact?.id
                }
            });
        } catch (error) {
            console.error('Assessment completion error:', error);
            res.status(500).json({ error: 'Failed to complete assessment' });
        }
    });

    // Questions API using Supabase
    app.get('/api/questions', async (req, res) => {
        try {
            const { industry, role } = req.query;
            
            // Check Redis cache first
            const cacheKey = `questions:${industry || 'all'}:${role || 'all'}`;
            let questions = await redisClient.getJSON(cacheKey);
            
            if (!questions && supabaseClient.isConnected) {
                // Load from Supabase
                questions = await supabaseClient.getQuestions({ industry, role });
                
                if (questions) {
                    // Cache for 30 minutes
                    await redisClient.setJSON(cacheKey, questions, 1800);
                }
            }
            
            // Fallback to JSON files
            if (!questions) {
                const fs = require('fs');
                const path = require('path');
                try {
                    const coreQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, 'coreQuestions.json'), 'utf8'));
                    questions = coreQuestions.sections || [];
                    await redisClient.setJSON(cacheKey, questions, 1800);
                } catch (fileError) {
                    console.warn('Failed to load questions from file:', fileError.message);
                }
            }
            
            res.json({ questions: questions || [] });
        } catch (error) {
            console.error('Questions API error:', error);
            res.status(500).json({ error: 'Failed to load questions' });
        }
    });

    // Benchmarks API with Supabase + file fallback
    app.get('/api/benchmarks', async (req, res) => {
        try {
            const { industry, companySize } = req.query;
            
            // Check cache first
            const cacheKey = `benchmarks:${industry || 'all'}:${companySize || 'all'}`;
            let benchmarks = await redisClient.getJSON(cacheKey);
            
            if (!benchmarks && supabaseClient.isConnected) {
                // Load from Supabase
                try {
                    let query = supabaseClient.client.from('benchmarks').select('*');
                    
                    if (industry) {
                        query = query.eq('industry', industry);
                    }
                    if (companySize) {
                        query = query.eq('company_size', companySize);
                    }
                    
                    const { data, error } = await query;
                    if (!error && data) {
                        benchmarks = data;
                        await redisClient.setJSON(cacheKey, benchmarks, 3600);
                    }
                } catch (supabaseError) {
                    console.warn('Supabase benchmarks load failed:', supabaseError.message);
                }
            }
            
            // Fallback to file
            if (!benchmarks) {
                const fs = require('fs');
                const path = require('path');
                const benchmarksPath = path.join(__dirname, 'benchmarks.js');
                
                if (fs.existsSync(benchmarksPath)) {
                    delete require.cache[require.resolve('./benchmarks.js')];
                    const benchmarksModule = require('./benchmarks.js');
                    benchmarks = typeof benchmarksModule === 'function' ? benchmarksModule() : benchmarksModule;
                    
                    await redisClient.setJSON(cacheKey, benchmarks, 3600);
                }
            }
            
            res.json({ benchmarks: benchmarks || [] });
        } catch (error) {
            console.error('Benchmarks API error:', error);
            res.status(500).json({ error: 'Failed to load benchmarks' });
        }
    });

    // Analytics API using Supabase
    app.get('/api/analytics/overview', async (req, res) => {
        try {
            if (!supabaseClient.isConnected) {
                return res.status(503).json({ error: 'Analytics unavailable - database not connected' });
            }
            
            // Check cache first
            const cachedAnalytics = await redisClient.getJSON('analytics:overview');
            if (cachedAnalytics) {
                return res.json(cachedAnalytics);
            }
            
            // Get assessment statistics
            const stats = await supabaseClient.getAssessmentStats();
            
            if (stats) {
                const analytics = {
                    totalAssessments: stats.length,
                    averageScore: stats.reduce((sum, a) => sum + (a.score || 0), 0) / stats.length || 0,
                    industryBreakdown: {},
                    companySizeBreakdown: {},
                    completionTrend: [],
                    lastUpdated: new Date().toISOString()
                };
                
                // Process industry breakdown
                stats.forEach(assessment => {
                    if (assessment.industry) {
                        analytics.industryBreakdown[assessment.industry] = 
                            (analytics.industryBreakdown[assessment.industry] || 0) + 1;
                    }
                    if (assessment.company_size) {
                        analytics.companySizeBreakdown[assessment.company_size] = 
                            (analytics.companySizeBreakdown[assessment.company_size] || 0) + 1;
                    }
                });
                
                // Cache for 15 minutes
                await redisClient.setJSON('analytics:overview', analytics, 900);
                res.json(analytics);
            } else {
                res.status(500).json({ error: 'Failed to fetch analytics' });
            }
        } catch (error) {
            console.error('Analytics API error:', error);
            res.status(500).json({ error: 'Failed to load analytics' });
        }
    });

    // Health check
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            redis: redisClient.isConnected,
            supabase: supabaseClient.isConnected,
            hubspot: hubspotClient.isConnected,
            services: {
                cache: redisClient.isConnected ? 'healthy' : 'unavailable',
                database: supabaseClient.isConnected ? 'healthy' : 'unavailable',
                crm: hubspotClient.isConnected ? 'healthy' : 'unavailable'
            }
        });
    });

    // User registration endpoint
    app.post('/api/users', async (req, res) => {
        try {
            const { firstName, lastName, email, industry, jobTitle, role, orgSize, consentMarketing } = req.body;
            const sessionId = req.sessionID;
            
            const userData = {
                first_name: firstName,
                last_name: lastName,
                email,
                industry,
                job_title: jobTitle,
                role,
                org_size: orgSize,
                consent_marketing: consentMarketing,
                session_id: sessionId,
                created_at: new Date().toISOString()
            };
            
            // Save to Redis for session
            await redisClient.setJSON(`user:${sessionId}`, userData, 86400);
            
            // Save to Supabase for persistence
            if (supabaseClient.isConnected) {
                try {
                    await supabaseClient.client
                        .from('users')
                        .upsert(userData, { onConflict: 'session_id' });
                } catch (supabaseError) {
                    console.warn('Supabase user save failed:', supabaseError.message);
                }
            }
            
            res.json({ success: true, sessionId });
        } catch (error) {
            console.error('User registration error:', error);
            res.status(500).json({ error: 'Failed to save user data' });
        }
    });

    // Results collection endpoint
    app.post('/api/results', async (req, res) => {
        try {
            const resultsData = req.body;
            const sessionId = req.sessionID;
            
            // Transform frontend data format to backend format
            const assessmentData = {
                freeResponses: resultsData.freeResponses || {},
                allAnswers: resultsData.allAnswers || {},
                timestamp: resultsData.timestamp
            };
            
            const userInfo = resultsData.user || {};
            const score = resultsData.scores?.overall || 0;
            const sectionScores = {
                strategy: resultsData.scores?.strategy || 0,
                operations: resultsData.scores?.operations || 0,
                technology: resultsData.scores?.technology || 0,
                data: resultsData.scores?.data || 0,
                culture: resultsData.scores?.culture || 0,
                governance: resultsData.scores?.automation || 0 // Map automation to governance
            };
            
            console.log('📊 Processing results with free responses:', Object.keys(assessmentData.freeResponses));
            
            // Call the existing assessment completion logic directly
            const completedData = {
                assessmentData,
                userInfo,
                score,
                sectionScores,
                completedAt: new Date().toISOString()
            };
            
            // Cache completed assessment in Redis
            await redisClient.setJSON(`completed:${sessionId}`, completedData, 86400);
            
            let assessmentId = null;
            
            // Save to Supabase for permanent storage
            if (supabaseClient.isConnected) {
                try {
                    const supabaseData = {
                        session_id: sessionId,
                        answers: assessmentData,
                        score: score,
                        section_scores: sectionScores,
                        email: userInfo?.email,
                        industry: userInfo?.industry,
                        company_size: userInfo?.companySize,
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    };
                    
                    const created = await supabaseClient.saveAssessment(supabaseData);
                    assessmentId = created?.id;
                } catch (supabaseError) {
                    console.warn('Supabase completion save failed:', supabaseError.message);
                }
            }
            
            // Create HubSpot lead if email provided and HubSpot connected
            let hubspotContact = null;
            let hubspotDeal = null;
            
            if (hubspotClient.isConnected && userInfo?.email) {
                try {
                    // Check if contact already exists
                    const existingContact = await hubspotClient.getContactByEmail(userInfo.email);
                    
                    if (existingContact) {
                        hubspotContact = await hubspotClient.updateContactAssessment(
                            userInfo.email, 
                            assessmentId, 
                            {
                                ai_readiness_score: score.toString(),
                                last_assessment_date: new Date().toISOString().split('T')[0]
                            }
                        );
                        console.log('📊 Updated existing HubSpot contact');
                    } else {
                        hubspotContact = await hubspotClient.createContactFromAssessment(
                            assessmentData, 
                            userInfo, 
                            score, 
                            sectionScores
                        );
                        console.log('🎯 Created new HubSpot contact');
                    }
                    
                    // Create deal for high-scoring assessments
                    if (hubspotContact && score >= 70) {
                        hubspotDeal = await hubspotClient.createDealFromAssessment(
                            hubspotContact.id, 
                            assessmentData, 
                            score, 
                            userInfo
                        );
                        
                        if (hubspotDeal) {
                            console.log('💰 Created HubSpot deal for high-scoring assessment');
                        }
                    }
                    
                    // Add assessment insights as note with free responses
                    if (hubspotContact) {
                        const keyInsights = generateKeyInsights(sectionScores, score);
                        const freeResponses = assessmentData?.freeResponses || {};
                        await hubspotClient.addAssessmentNote(hubspotContact.id, score, keyInsights, freeResponses);
                    }
                    
                } catch (hubspotError) {
                    console.warn('HubSpot integration failed:', hubspotError.message);
                }
            }
            
            res.json({ 
                success: true, 
                sessionId, 
                score, 
                sectionScores,
                hubspot: {
                    contactCreated: !!hubspotContact,
                    dealCreated: !!hubspotDeal,
                    contactId: hubspotContact?.id
                }
            });
        } catch (error) {
            console.error('Results collection error:', error);
            res.status(500).json({ error: 'Failed to save results' });
        }
    });

    // Error handling middleware
    app.use((error, req, res, next) => {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    });

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
}

startServer();

module.exports = app;