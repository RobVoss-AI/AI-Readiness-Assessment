// routes/benchmarks.js - Industry benchmarking data for radar charts
const express = require('express');
const router = express.Router();

// Industry benchmark data based on research and anonymized client data
const industryBenchmarks = {
    'Finance & Banking': {
        averages: {
            strategy: 72,
            operations: 68,
            technology: 75,
            data: 80,
            culture: 65,
            automation: 70
        },
        percentiles: {
            p25: { strategy: 58, operations: 55, technology: 62, data: 68, culture: 52, automation: 58 },
            p50: { strategy: 72, operations: 68, technology: 75, data: 80, culture: 65, automation: 70 },
            p75: { strategy: 85, operations: 82, technology: 88, data: 92, culture: 78, automation: 83 },
            p90: { strategy: 92, operations: 90, technology: 95, data: 97, culture: 88, automation: 92 }
        },
        insights: {
            strengths: ['Data governance', 'Technology infrastructure', 'Regulatory compliance'],
            challenges: ['Cultural resistance to AI', 'Legacy system integration', 'AI governance and ethics'],
            opportunities: ['AI-powered fraud detection', 'Generative AI for compliance reporting', 'Intelligent customer service agents', 'AI-driven risk modeling']
        }
    },
    'Healthcare': {
        averages: {
            strategy: 68,
            operations: 70,
            technology: 65,
            data: 75,
            culture: 72,
            automation: 68
        },
        percentiles: {
            p25: { strategy: 55, operations: 58, technology: 52, data: 62, culture: 60, automation: 55 },
            p50: { strategy: 68, operations: 70, technology: 65, data: 75, culture: 72, automation: 68 },
            p75: { strategy: 82, operations: 85, technology: 78, data: 88, culture: 85, automation: 82 },
            p90: { strategy: 90, operations: 92, technology: 88, data: 95, culture: 92, automation: 90 }
        },
        insights: {
            strengths: ['Patient-focused culture', 'Rich clinical data', 'Operational efficiency focus'],
            challenges: ['HIPAA and AI compliance', 'Legacy EHR integration', 'Clinician AI training'],
            opportunities: ['AI-assisted diagnostics', 'Intelligent patient monitoring', 'Administrative workflow automation', 'Clinical documentation with generative AI']
        }
    },
    'Education': {
        averages: {
            strategy: 62,
            operations: 65,
            technology: 60,
            data: 68,
            culture: 78,
            automation: 62
        },
        percentiles: {
            p25: { strategy: 50, operations: 52, technology: 48, data: 55, culture: 65, automation: 48 },
            p50: { strategy: 62, operations: 65, technology: 60, data: 68, culture: 78, automation: 62 },
            p75: { strategy: 76, operations: 78, technology: 74, data: 82, culture: 90, automation: 78 },
            p90: { strategy: 86, operations: 88, technology: 86, data: 92, culture: 96, automation: 88 }
        },
        insights: {
            strengths: ['Learning-focused culture', 'Collaborative environment', 'Early generative AI adoption by faculty'],
            challenges: ['Budget constraints', 'AI policy development', 'Academic integrity concerns'],
            opportunities: ['AI-powered personalized learning', 'Student success analytics', 'Administrative automation', 'AI-assisted content and curriculum development']
        }
    },
    'Technology': {
        averages: {
            strategy: 82,
            operations: 78,
            technology: 88,
            data: 84,
            culture: 80,
            automation: 85
        },
        percentiles: {
            p25: { strategy: 70, operations: 65, technology: 75, data: 72, culture: 68, automation: 72 },
            p50: { strategy: 82, operations: 78, technology: 88, data: 84, culture: 80, automation: 85 },
            p75: { strategy: 93, operations: 90, technology: 96, data: 93, culture: 92, automation: 94 },
            p90: { strategy: 97, operations: 95, technology: 98, data: 97, culture: 96, automation: 98 }
        },
        insights: {
            strengths: ['Technical AI expertise', 'Innovation culture', 'AI-native development practices'],
            challenges: ['Scaling AI across all functions', 'Responsible AI governance', 'AI talent retention'],
            opportunities: ['AI-powered product features', 'AI coding assistants and agents', 'Intelligent customer insights', 'AI-driven QA and testing']
        }
    },
    'Manufacturing': {
        averages: {
            strategy: 66,
            operations: 80,
            technology: 72,
            data: 70,
            culture: 66,
            automation: 78
        },
        percentiles: {
            p25: { strategy: 54, operations: 67, technology: 60, data: 57, culture: 54, automation: 65 },
            p50: { strategy: 66, operations: 80, technology: 72, data: 70, culture: 66, automation: 78 },
            p75: { strategy: 80, operations: 92, technology: 85, data: 84, culture: 80, automation: 90 },
            p90: { strategy: 90, operations: 96, technology: 94, data: 93, culture: 90, automation: 96 }
        },
        insights: {
            strengths: ['Process optimization maturity', 'Operational data availability', 'Existing automation foundation'],
            challenges: ['Legacy equipment integration', 'Workforce AI upskilling', 'IT/OT convergence for AI'],
            opportunities: ['AI predictive maintenance', 'Computer vision quality control', 'AI-optimized supply chains', 'Generative AI for design and engineering']
        }
    },
    'Legal': {
        averages: {
            strategy: 62,
            operations: 65,
            technology: 62,
            data: 74,
            culture: 62,
            automation: 68
        },
        percentiles: {
            p25: { strategy: 50, operations: 52, technology: 50, data: 62, culture: 50, automation: 55 },
            p50: { strategy: 62, operations: 65, technology: 62, data: 74, culture: 62, automation: 68 },
            p75: { strategy: 76, operations: 80, technology: 78, data: 87, culture: 78, automation: 82 },
            p90: { strategy: 86, operations: 90, technology: 90, data: 94, culture: 87, automation: 92 }
        },
        insights: {
            strengths: ['Document management maturity', 'Analytical thinking', 'Growing AI adoption momentum'],
            challenges: ['Client confidentiality with AI', 'Risk-averse culture', 'AI ethics and bias concerns'],
            opportunities: ['AI-powered document review and contract analysis', 'Legal research with LLMs', 'AI-assisted due diligence', 'Generative AI for drafting and summarization']
        }
    },
    'Retail': {
        averages: {
            strategy: 72,
            operations: 76,
            technology: 70,
            data: 72,
            culture: 70,
            automation: 74
        },
        percentiles: {
            p25: { strategy: 60, operations: 64, technology: 58, data: 60, culture: 58, automation: 62 },
            p50: { strategy: 72, operations: 76, technology: 70, data: 72, culture: 70, automation: 74 },
            p75: { strategy: 85, operations: 90, technology: 84, data: 85, culture: 84, automation: 87 },
            p90: { strategy: 93, operations: 96, technology: 93, data: 93, culture: 92, automation: 94 }
        },
        insights: {
            strengths: ['Customer data richness', 'Omnichannel data integration', 'Fast adoption of AI tools'],
            challenges: ['Data privacy across channels', 'AI personalization at scale', 'Workforce AI training'],
            opportunities: ['AI-powered personalization and recommendations', 'Intelligent inventory and demand forecasting', 'Generative AI for marketing content', 'AI customer service agents']
        }
    },
    'Consulting': {
        averages: {
            strategy: 78,
            operations: 74,
            technology: 72,
            data: 70,
            culture: 82,
            automation: 74
        },
        percentiles: {
            p25: { strategy: 66, operations: 62, technology: 60, data: 58, culture: 70, automation: 62 },
            p50: { strategy: 78, operations: 74, technology: 72, data: 70, culture: 82, automation: 74 },
            p75: { strategy: 90, operations: 87, technology: 85, data: 84, culture: 93, automation: 87 },
            p90: { strategy: 96, operations: 93, technology: 93, data: 92, culture: 97, automation: 94 }
        },
        insights: {
            strengths: ['Strategic AI thinking', 'Change management expertise', 'High generative AI adoption'],
            challenges: ['Standardizing AI across projects', 'Knowledge management at scale', 'Client data governance'],
            opportunities: ['AI-augmented client insights', 'Generative AI for proposal and report creation', 'AI-powered knowledge management', 'Intelligent project delivery']
        }
    }
};

// Get industry benchmarks
router.get('/industry/:industry', (req, res) => {
    try {
        const { industry } = req.params;
        const benchmarkData = industryBenchmarks[industry];
        
        if (!benchmarkData) {
            return res.status(404).json({ 
                error: 'Industry not found',
                availableIndustries: Object.keys(industryBenchmarks)
            });
        }
        
        res.json({
            industry,
            ...benchmarkData,
            sampleSize: getIndustrySampleSize(industry),
            lastUpdated: '2026-01-15'
        });
        
    } catch (error) {
        console.error('Benchmark retrieval error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve benchmarks',
            message: error.message 
        });
    }
});

// Get percentile ranking for scores
router.post('/percentile-ranking', (req, res) => {
    try {
        const { industry, scores } = req.body;
        
        if (!industry || !scores) {
            return res.status(400).json({ error: 'Industry and scores required' });
        }
        
        const benchmarkData = industryBenchmarks[industry];
        if (!benchmarkData) {
            return res.status(404).json({ error: 'Industry not found' });
        }
        
        const rankings = {};
        const { percentiles } = benchmarkData;
        
        Object.keys(scores).forEach(dimension => {
            const score = scores[dimension];
            let percentile = 0;
            
            if (score >= percentiles.p90[dimension]) percentile = 90;
            else if (score >= percentiles.p75[dimension]) percentile = 75;
            else if (score >= percentiles.p50[dimension]) percentile = 50;
            else if (score >= percentiles.p25[dimension]) percentile = 25;
            
            rankings[dimension] = {
                score,
                percentile,
                industryAverage: benchmarkData.averages[dimension],
                ranking: getPercentileDescription(percentile)
            };
        });
        
        // Calculate overall percentile
        const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
        const overallAverage = Object.values(benchmarkData.averages).reduce((sum, score) => sum + score, 0) / Object.keys(benchmarkData.averages).length;
        
        let overallPercentile = 0;
        const avgPercentiles = Object.values(percentiles.p90).reduce((sum, score) => sum + score, 0) / Object.keys(percentiles.p90).length;
        
        if (overallScore >= avgPercentiles) overallPercentile = 90;
        else if (overallScore >= Object.values(percentiles.p75).reduce((sum, score) => sum + score, 0) / Object.keys(percentiles.p75).length) overallPercentile = 75;
        else if (overallScore >= overallAverage) overallPercentile = 50;
        else overallPercentile = 25;
        
        res.json({
            industry,
            rankings,
            overall: {
                score: Math.round(overallScore),
                percentile: overallPercentile,
                industryAverage: Math.round(overallAverage),
                ranking: getPercentileDescription(overallPercentile)
            },
            insights: benchmarkData.insights
        });
        
    } catch (error) {
        console.error('Percentile ranking error:', error);
        res.status(500).json({ 
            error: 'Failed to calculate percentile ranking',
            message: error.message 
        });
    }
});

// Get all available industries
router.get('/industries', (req, res) => {
    try {
        const industries = Object.keys(industryBenchmarks).map(industry => ({
            name: industry,
            sampleSize: getIndustrySampleSize(industry),
            averageReadiness: Math.round(
                Object.values(industryBenchmarks[industry].averages)
                    .reduce((sum, score) => sum + score, 0) / 6
            )
        }));
        
        res.json({ industries });
        
    } catch (error) {
        console.error('Industries list error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve industries list',
            message: error.message 
        });
    }
});

// Helper functions
function getIndustrySampleSize(industry) {
    // Mock sample sizes (in production, get from database)
    const sampleSizes = {
        'Finance & Banking': 384,
        'Healthcare': 296,
        'Education': 243,
        'Technology': 512,
        'Manufacturing': 318,
        'Legal': 156,
        'Retail': 347,
        'Consulting': 228
    };
    
    return sampleSizes[industry] || 50;
}

function getPercentileDescription(percentile) {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
}

module.exports = router;