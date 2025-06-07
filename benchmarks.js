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
            challenges: ['Cultural resistance', 'Legacy system integration', 'Change management'],
            opportunities: ['Fraud detection', 'Risk assessment', 'Customer service automation', 'Regulatory reporting']
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
            strengths: ['Patient-focused culture', 'Data richness', 'Operational efficiency focus'],
            challenges: ['HIPAA compliance', 'Legacy EHR systems', 'Staff training'],
            opportunities: ['Diagnostic assistance', 'Patient monitoring', 'Administrative automation', 'Predictive analytics']
        }
    },
    'Education': {
        averages: {
            strategy: 60,
            operations: 65,
            technology: 58,
            data: 68,
            culture: 75,
            automation: 62
        },
        percentiles: {
            p25: { strategy: 48, operations: 52, technology: 45, data: 55, culture: 62, automation: 48 },
            p50: { strategy: 60, operations: 65, technology: 58, data: 68, culture: 75, automation: 62 },
            p75: { strategy: 75, operations: 78, technology: 72, data: 82, culture: 88, automation: 78 },
            p90: { strategy: 85, operations: 88, technology: 85, data: 92, culture: 95, automation: 88 }
        },
        insights: {
            strengths: ['Learning-focused culture', 'Collaborative environment', 'Student-centric approach'],
            challenges: ['Budget constraints', 'Technology gaps', 'Faculty training'],
            opportunities: ['Personalized learning', 'Student analytics', 'Administrative efficiency', 'Content creation']
        }
    },
    'Technology': {
        averages: {
            strategy: 80,
            operations: 75,
            technology: 85,
            data: 82,
            culture: 78,
            automation: 80
        },
        percentiles: {
            p25: { strategy: 68, operations: 62, technology: 72, data: 70, culture: 65, automation: 68 },
            p50: { strategy: 80, operations: 75, technology: 85, data: 82, culture: 78, automation: 80 },
            p75: { strategy: 92, operations: 88, technology: 95, data: 92, culture: 90, automation: 92 },
            p90: { strategy: 97, operations: 95, technology: 98, data: 97, culture: 95, automation: 97 }
        },
        insights: {
            strengths: ['Technical expertise', 'Innovation culture', 'Agile processes'],
            challenges: ['Scaling AI initiatives', 'ROI measurement', 'Cross-team coordination'],
            opportunities: ['Product enhancement', 'Process optimization', 'Customer insights', 'Automated testing']
        }
    },
    'Manufacturing': {
        averages: {
            strategy: 65,
            operations: 78,
            technology: 70,
            data: 68,
            culture: 65,
            automation: 75
        },
        percentiles: {
            p25: { strategy: 52, operations: 65, technology: 58, data: 55, culture: 52, automation: 62 },
            p50: { strategy: 65, operations: 78, technology: 70, data: 68, culture: 65, automation: 75 },
            p75: { strategy: 78, operations: 90, technology: 83, data: 82, culture: 78, automation: 88 },
            p90: { strategy: 88, operations: 95, technology: 92, data: 92, culture: 88, automation: 95 }
        },
        insights: {
            strengths: ['Process optimization focus', 'Operational efficiency', 'Quality control'],
            challenges: ['Legacy equipment', 'Workforce training', 'System integration'],
            opportunities: ['Predictive maintenance', 'Quality control', 'Supply chain optimization', 'Energy management']
        }
    },
    'Legal': {
        averages: {
            strategy: 58,
            operations: 62,
            technology: 60,
            data: 72,
            culture: 60,
            automation: 65
        },
        percentiles: {
            p25: { strategy: 45, operations: 48, technology: 47, data: 58, culture: 47, automation: 52 },
            p50: { strategy: 58, operations: 62, technology: 60, data: 72, culture: 60, automation: 65 },
            p75: { strategy: 72, operations: 78, technology: 75, data: 85, culture: 75, automation: 80 },
            p90: { strategy: 83, operations: 88, technology: 87, data: 92, culture: 85, automation: 90 }
        },
        insights: {
            strengths: ['Document management', 'Analytical thinking', 'Attention to detail'],
            challenges: ['Conservative culture', 'Client confidentiality', 'Billing model changes'],
            opportunities: ['Document review', 'Legal research', 'Contract analysis', 'Due diligence automation']
        }
    },
    'Retail': {
        averages: {
            strategy: 70,
            operations: 75,
            technology: 68,
            data: 70,
            culture: 68,
            automation: 72
        },
        percentiles: {
            p25: { strategy: 58, operations: 62, technology: 55, data: 58, culture: 55, automation: 60 },
            p50: { strategy: 70, operations: 75, technology: 68, data: 70, culture: 68, automation: 72 },
            p75: { strategy: 83, operations: 88, technology: 82, data: 83, culture: 82, automation: 85 },
            p90: { strategy: 92, operations: 95, technology: 92, data: 92, culture: 90, automation: 92 }
        },
        insights: {
            strengths: ['Customer focus', 'Data availability', 'Operational agility'],
            challenges: ['Seasonal variations', 'Inventory complexity', 'Omnichannel integration'],
            opportunities: ['Personalization', 'Inventory optimization', 'Customer service', 'Demand forecasting']
        }
    },
    'Consulting': {
        averages: {
            strategy: 75,
            operations: 72,
            technology: 70,
            data: 68,
            culture: 80,
            automation: 70
        },
        percentiles: {
            p25: { strategy: 62, operations: 58, technology: 58, data: 55, culture: 68, automation: 58 },
            p50: { strategy: 75, operations: 72, technology: 70, data: 68, culture: 80, automation: 70 },
            p75: { strategy: 88, operations: 85, technology: 83, data: 82, culture: 92, automation: 83 },
            p90: { strategy: 95, operations: 92, technology: 92, data: 90, culture: 97, automation: 92 }
        },
        insights: {
            strengths: ['Strategic thinking', 'Change management', 'Client focus'],
            challenges: ['Project-based work', 'Knowledge management', 'Scalability'],
            opportunities: ['Client insights', 'Proposal automation', 'Knowledge management', 'Delivery optimization']
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
            lastUpdated: '2024-12-01'
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
        'Finance & Banking': 247,
        'Healthcare': 189,
        'Education': 156,
        'Technology': 312,
        'Manufacturing': 198,
        'Legal': 87,
        'Retail': 203,
        'Consulting': 134
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