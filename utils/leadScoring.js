// utils/leadScoring.js - Consulting opportunity scoring for assessment leads
//
// Readiness and opportunity are different things: a mid-sized organization with
// real gaps and an executive respondent is a better consulting lead than a small,
// already-advanced one. This scores the opportunity, not the readiness.

const SIZE_FIT = { '1-10': 10, '11-50': 20, '51-200': 30, '201-1000': 35, '1001-5000': 35, '5000+': 30 };
const ROLE_AUTHORITY = { Executive: 15, Manager: 10, Consultant: 5, 'Team Member': 3 };

// Typical first-engagement value by organization size (USD)
const ENGAGEMENT_BASE = {
    '1-10': 5000,
    '11-50': 12000,
    '51-200': 25000,
    '201-1000': 50000,
    '1001-5000': 90000,
    '5000+': 150000
};

const AGREE = 3; // Likert index for "Agree" (0 = Strongly Disagree ... 4 = Strongly Agree)

function scoreLead({ overall, orgSize, role, answers = {}, freeResponses = {} }) {
    const sizeFit = SIZE_FIT[orgSize] ?? 15;
    const need = Math.round((100 - Math.min(100, Math.max(0, overall || 0))) * 0.3);
    const authority = ROLE_AUTHORITY[role] ?? 5;

    const answeredOpen = Object.values(freeResponses).filter(v => typeof v === 'string' && v.trim().length > 20).length;
    let intent = Math.min(12, answeredOpen * 3);
    if (answers.strategy_budget >= AGREE) intent += 4;
    if (answers.strategy_leadership >= AGREE) intent += 4;

    const priority = Math.min(100, sizeFit + need + authority + intent);
    const threshold = parseInt(process.env.HUBSPOT_DEAL_THRESHOLD, 10) || 60;
    const tier = priority >= 75 ? 'A' : priority >= 55 ? 'B' : 'C';

    const base = ENGAGEMENT_BASE[orgSize] ?? ENGAGEMENT_BASE['11-50'];
    const gapMultiplier = 1 + (100 - (overall || 0)) / 200; // 1.0 (fully ready) → 1.5 (not ready)

    return {
        priority,
        tier,
        qualified: priority >= threshold,
        estimatedDealValue: Math.round((base * gapMultiplier) / 500) * 500,
        breakdown: { sizeFit, need, authority, intent }
    };
}

module.exports = { scoreLead, ENGAGEMENT_BASE };
