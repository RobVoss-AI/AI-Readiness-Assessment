// Storage utility
function safeLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value)
        };
    } catch (e) {
        const memoryStorage = {};
        return {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; }
        };
    }
}

const storage = safeLocalStorage();

// Same-origin in production (Netlify proxies /api/* to the backend)
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : '/api';

const DIMENSIONS = [
    { key: 'strategy', label: 'Strategy' },
    { key: 'operations', label: 'Operations' },
    { key: 'technology', label: 'Technology' },
    { key: 'data', label: 'Data' },
    { key: 'culture', label: 'Culture' },
    { key: 'automation', label: 'Automation' },
    { key: 'governance', label: 'Governance' }
];
const LOCKED_DIMENSIONS = ['data', 'automation'];

// Load data
let userData = null;
let scores = null;

try {
    userData = JSON.parse(storage.getItem("voss_user") || "null");
    scores = JSON.parse(storage.getItem("voss_scores") || "null");
} catch (e) {
    console.error('Error parsing stored assessment data:', e);
}

// Only real, completed assessments are sent to the backend (never demo data)
const hasRealData = !!(userData && userData.email && scores && Object.keys(scores).length > 0);

// Fallback data if needed
if (!userData) {
    userData = {
        firstName: 'User',
        industry: 'Technology',
        jobTitle: 'Manager',
        role: 'Manager'
    };
}

if (!scores || Object.keys(scores).length === 0) {
    // Try to reconstruct from answers
    const answers = JSON.parse(storage.getItem("voss_answers") || "{}");
    if (Object.keys(answers).length > 0) {
        scores = reconstructScores(answers);
    } else {
        // Demo scores
        scores = {
            strategy: 75,
            operations: 68,
            technology: 82,
            data: 60,
            culture: 78,
            automation: 65,
            governance: 55
        };
    }
}

// Reconstruct scores from answers
function reconstructScores(answers) {
    const sections = {
        strategy: ['strategy_vision', 'strategy_problems', 'strategy_leadership', 'strategy_budget', 'strategy_culture'],
        operations: ['ops_process_mapping', 'ops_automation_candidates', 'ops_change_readiness', 'ops_efficiency_measurement'],
        technology: ['tech_infrastructure', 'tech_cloud_experience', 'tech_data_systems', 'tech_security'],
        data: ['data_quality', 'data_accessibility', 'data_governance', 'data_privacy'],
        culture: ['culture_enthusiasm', 'culture_change_embrace', 'culture_learning', 'culture_collaboration'],
        automation: ['auto_current_state', 'auto_employee_understanding', 'auto_tools_experience', 'auto_roi_measurement'],
        governance: ['gov_policy', 'gov_approved_tools', 'gov_client_data', 'gov_human_review', 'gov_agents']
    };

    const reconstructed = {};

    Object.keys(sections).forEach(sectionId => {
        let total = 0;
        let count = 0;

        sections[sectionId].forEach(questionId => {
            if (answers[questionId] !== undefined) {
                total += (answers[questionId] / 4) * 100;
                count++;
            } else {
                total += 50; // Default unsure
                count++;
            }
        });

        reconstructed[sectionId] = count > 0 ? Math.round(total / count) : 50;
    });

    return reconstructed;
}

// Display scores
const strategyScore = scores.strategy || 0;
const operationsScore = scores.operations || 0;
const technologyScore = scores.technology || 0;
const dataScore = scores.data || 0;
const cultureScore = scores.culture || 0;
const automationScore = scores.automation || 0;
// Assessments taken before the governance section existed have no governance score
const hasGovernance = typeof scores.governance === 'number';
const governanceScore = hasGovernance ? scores.governance : null;

document.getElementById("strategyScore").textContent = `${strategyScore}%`;
document.getElementById("operationsScore").textContent = `${operationsScore}%`;
document.getElementById("technologyScore").textContent = `${technologyScore}%`;
document.getElementById("cultureScore").textContent = `${cultureScore}%`;
document.getElementById("governanceScore").textContent = hasGovernance ? `${governanceScore}%` : 'N/A';
// Data and Automation stay locked (🔒 in the markup) until unlockFullResults()

// Calculate overall score across every answered dimension
const answeredScores = [strategyScore, operationsScore, technologyScore, dataScore, cultureScore, automationScore]
    .concat(hasGovernance ? [governanceScore] : []);
const overallScore = Math.round(answeredScores.reduce((sum, value) => sum + value, 0) / answeredScores.length);

// Update overall score with animation
let currentScore = 0;
const targetScore = overallScore;
const scoreElement = document.getElementById("overallScore");
const progressBar = document.getElementById("overallProgressBar");

const animateScore = () => {
    const increment = targetScore / 60; // 1 second animation at 60fps
    if (currentScore < targetScore) {
        currentScore += increment;
        scoreElement.textContent = `${Math.round(currentScore)}%`;
        progressBar.style.width = `${Math.round(currentScore)}%`;
        requestAnimationFrame(animateScore);
    } else {
        scoreElement.textContent = `${targetScore}%`;
        progressBar.style.width = `${targetScore}%`;
    }
};

setTimeout(animateScore, 500);

// Update readiness level
let readinessLevel = 'Beginning';
let levelColor = 'text-red-600';
if (overallScore >= 80) {
    readinessLevel = 'Advanced';
    levelColor = 'text-green-600';
} else if (overallScore >= 60) {
    readinessLevel = 'Intermediate';
    levelColor = 'text-blue-600';
} else if (overallScore >= 40) {
    readinessLevel = 'Developing';
    levelColor = 'text-yellow-600';
}

const levelElement = document.getElementById("readinessLevel");
levelElement.textContent = `${readinessLevel} Level`;
levelElement.className = `text-lg ${levelColor}`;

// Update greeting
document.getElementById("userGreeting").textContent =
    `Hello ${userData.firstName}! Here's your personalized AI readiness assessment.`;

// One ID per completed assessment so a reload or retry never creates a duplicate CRM record
function getSubmissionId() {
    let id = storage.getItem('voss_submission_id');
    if (!id) {
        id = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        storage.setItem('voss_submission_id', id);
    }
    return id;
}

function collectFreeResponses() {
    const answers = JSON.parse(storage.getItem("voss_answers") || "{}");
    const freeResponses = {};
    ['strategy_open', 'ops_open', 'tech_open', 'data_open', 'culture_open', 'auto_open', 'gov_open'].forEach(key => {
        freeResponses[key] = answers[key] || '';
    });
    return { answers, freeResponses };
}

// Send results to the backend (Supabase + HubSpot) exactly once per submission
async function sendResultsToDataCollection() {
    const { answers, freeResponses } = collectFreeResponses();

    const completeData = {
        type: 'assessment_results',
        submissionId: getSubmissionId(),
        timestamp: new Date().toISOString(),
        user: userData,
        scores: {
            strategy: strategyScore,
            operations: operationsScore,
            technology: technologyScore,
            data: dataScore,
            culture: cultureScore,
            automation: automationScore,
            ...(hasGovernance ? { governance: governanceScore } : {}),
            overall: overallScore
        },
        freeResponses: freeResponses,
        readinessLevel: readinessLevel,
        allAnswers: answers
    };

    try {
        const response = await fetch(`${API_BASE}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completeData)
        });
        if (!response.ok) {
            console.error('Results API returned status:', response.status);
        }
        return response.ok;
    } catch (error) {
        console.error('Results API failed:', error);
        return false;
    }
}

// ---------- AI Executive Report ----------

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Free text was HTML-escaped when saved; decode it before sending so the model sees plain text
function decodeEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Set once the AI report arrives; takes precedence over the generic action plan
let personalizedRoadmap = null;

const SOURCE_LABELS = {
    anthropic: 'Claude Opus 5.5',
    openai: 'GPT-6 Astra'
};

async function loadAiReport() {
    const { freeResponses } = collectFreeResponses();
    Object.keys(freeResponses).forEach(key => { freeResponses[key] = decodeEntities(freeResponses[key]); });

    const payload = {
        submissionId: hasRealData ? getSubmissionId() : undefined,
        scores: {
            strategy: strategyScore,
            operations: operationsScore,
            technology: technologyScore,
            data: dataScore,
            culture: cultureScore,
            automation: automationScore,
            ...(hasGovernance ? { governance: governanceScore } : {})
        },
        profile: {
            industry: userData.industry,
            role: userData.role,
            orgSize: userData.orgSize
        },
        freeResponses
    };

    try {
        const response = await fetch(`${API_BASE}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const result = await response.json();
        storage.setItem('voss_ai_report', JSON.stringify(result));
        renderAiReport(result);
    } catch (error) {
        console.error('AI report unavailable:', error);
        // Fall back to the last report generated for this browser, if any
        const cached = JSON.parse(storage.getItem('voss_ai_report') || 'null');
        if (cached) {
            renderAiReport(cached);
        } else {
            document.getElementById('aiReportLoading').textContent =
                'Your detailed report is temporarily unavailable. Your scores, insights, and action plan below are complete.';
        }
    }
}

function renderAiReport({ report, source }) {
    document.getElementById('aiReportLoading').classList.add('hidden');
    document.getElementById('aiReportBody').classList.remove('hidden');

    document.getElementById('aiReportSource').textContent = source.provider === 'rules'
        ? 'Standard analysis'
        : `Personalized analysis by ${SOURCE_LABELS[source.provider] || source.model}`;

    document.getElementById('aiExecutiveSummary').textContent = report.executive_summary;
    document.getElementById('aiNarrative').textContent = report.readiness_narrative;

    document.getElementById('aiStrengths').innerHTML = report.strengths.map(item => `
        <li class="bg-green-50 rounded-lg p-3">
            <div class="font-semibold text-gray-900">${escapeHtml(item.title)}</div>
            <div class="text-sm text-gray-700">${escapeHtml(item.detail)}</div>
        </li>`).join('') || '<li class="text-sm text-gray-600">Keep building - strengths will emerge as your foundations grow.</li>';

    const riskBadge = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-gray-100 text-gray-700' };
    document.getElementById('aiGaps').innerHTML = report.gaps.map(item => `
        <li class="bg-red-50 rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-gray-900">${escapeHtml(item.title)}</span>
                <span class="text-xs font-medium px-2 py-1 rounded ${riskBadge[item.risk_level] || riskBadge.low}">${escapeHtml(item.risk_level)} risk</span>
            </div>
            <div class="text-sm text-gray-700">${escapeHtml(item.detail)}</div>
        </li>`).join('');

    // Use cases
    const sensitivityBadge = {
        public: 'bg-gray-100 text-gray-700',
        internal: 'bg-blue-100 text-blue-800',
        confidential: 'bg-yellow-100 text-yellow-800',
        regulated: 'bg-red-100 text-red-800'
    };
    document.getElementById('useCases').innerHTML = report.use_cases.map((useCase, index) => `
        <div class="border border-gray-200 rounded-lg p-5">
            <div class="text-sm font-semibold text-blue-600 mb-1">#${index + 1} · ${escapeHtml(useCase.department)}</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${escapeHtml(useCase.title)}</h3>
            <p class="text-sm text-gray-700 mb-4">${escapeHtml(useCase.description)}</p>
            <dl class="grid grid-cols-2 gap-2 text-sm">
                <dt class="text-gray-500">Hours saved / week</dt><dd class="font-semibold text-gray-900">~${escapeHtml(Math.round(useCase.est_hours_saved_per_week))}</dd>
                <dt class="text-gray-500">Time to value</dt><dd class="font-semibold text-gray-900">${escapeHtml(useCase.time_to_value_weeks)} weeks</dd>
                <dt class="text-gray-500">Effort</dt><dd class="font-semibold text-gray-900 capitalize">${escapeHtml(useCase.implementation_effort)}</dd>
                <dt class="text-gray-500">Data</dt><dd><span class="text-xs font-medium px-2 py-1 rounded capitalize ${sensitivityBadge[useCase.data_sensitivity] || sensitivityBadge.internal}">${escapeHtml(useCase.data_sensitivity)}</span></dd>
            </dl>
        </div>`).join('');
    document.getElementById('useCaseSection').classList.remove('hidden');

    // Replace the generic action plan with the personalized roadmap
    personalizedRoadmap = {
        immediate: report.roadmap.days_30,
        shortTerm: report.roadmap.days_60,
        longTerm: report.roadmap.days_90
    };
    renderActionPlan(personalizedRoadmap);

    document.getElementById('guardrails').innerHTML = report.governance_guardrails
        .map(rule => `<li class="flex items-start"><span class="text-green-600 mr-2">✓</span><span>${escapeHtml(rule)}</span></li>`)
        .join('');
    document.getElementById('guardrailSection').classList.remove('hidden');
}

// ---------- ROI & time-savings estimator ----------

function formatCurrency(value) {
    return '$' + Math.round(value).toLocaleString('en-US');
}

function initRoiCalculator() {
    const fields = {
        employees: document.getElementById('roiEmployees'),
        hourlyCost: document.getElementById('roiHourlyCost'),
        repetitiveHoursPerWeek: document.getElementById('roiHours'),
        adoptionRate: document.getElementById('roiAdoption')
    };

    const saved = JSON.parse(storage.getItem('voss_roi_inputs') || 'null');
    const defaults = RoiCalculator.DEFAULT_INPUTS;
    fields.employees.value = saved?.employees ?? RoiCalculator.headcountFor(userData.orgSize);
    fields.hourlyCost.value = saved?.hourlyCost ?? defaults.hourlyCost;
    fields.repetitiveHoursPerWeek.value = saved?.repetitiveHoursPerWeek ?? defaults.repetitiveHoursPerWeek;
    fields.adoptionRate.value = Math.round((saved?.adoptionRate ?? defaults.adoptionRate) * 100);

    const update = () => {
        const inputs = {
            employees: fields.employees.value,
            hourlyCost: fields.hourlyCost.value,
            repetitiveHoursPerWeek: fields.repetitiveHoursPerWeek.value,
            adoptionRate: fields.adoptionRate.value / 100
        };
        const roi = RoiCalculator.calculate({ ...inputs, readiness: overallScore });

        document.getElementById('roiHoursValue').textContent = `${roi.inputs.repetitiveHoursPerWeek} hrs`;
        document.getElementById('roiAdoptionValue').textContent = `${Math.round(roi.inputs.adoptionRate * 100)}%`;
        document.getElementById('roiWeeklyHours').textContent = roi.current.weeklyHours.toLocaleString('en-US');
        document.getElementById('roiAnnualValue').textContent = formatCurrency(roi.current.annualValue);
        document.getElementById('roiFte').textContent = roi.current.fteEquivalent.toLocaleString('en-US');
        document.getElementById('roiUnlockable').textContent = formatCurrency(roi.unlockableValue);
        document.getElementById('roiTargetReadiness').textContent = roi.targetReadiness;
        document.getElementById('roiUnlockCallout').classList.toggle('hidden', roi.unlockableValue <= 0);
        document.getElementById('roiAssumptions').innerHTML = roi.assumptions
            .map(item => `<li>${escapeHtml(item)}</li>`).join('');

        try {
            storage.setItem('voss_roi_inputs', JSON.stringify(roi.inputs));
        } catch (e) { /* storage full or blocked - estimates still work */ }
    };

    Object.values(fields).forEach(field => field.addEventListener('input', update));
    update();
}

document.getElementById('downloadReport').addEventListener('click', () => window.print());

// Global variables for unlock functionality
let isUnlocked = false;
let radarChartInstance = null;

// Create radar chart (initially with hidden segments)
function createRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');

    // Data and Automation stay hidden until unlocked; Governance is omitted for older assessments
    const chartDimensions = DIMENSIONS.filter(d => d.key !== 'governance' || hasGovernance);
    const chartData = chartDimensions.map(d =>
        (!isUnlocked && LOCKED_DIMENSIONS.includes(d.key)) ? null : (scores[d.key] || 0));

    const chartLabels = chartDimensions.map(d => d.label);

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Your AI Readiness',
                data: chartData,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 14 },
                        // Custom label generation to show locked segments
                        generateLabels: function (chart) {
                            const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            if (!isUnlocked) {
                                // Add visual indicators for locked segments
                                originalLabels[0].text = 'Your AI Readiness (2 segments locked 🔒)';
                            }
                            return originalLabels;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label;
                            const value = context.parsed.r;

                            if (value === null && !isUnlocked) {
                                return `${label}: Locked 🔒 - Click to unlock`;
                            }
                            return `${label}: ${value}%`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        stepSize: 20,
                        font: { size: 12 }
                    },
                    pointLabels: {
                        font: { size: 14, weight: 'bold' },
                        // Custom point label styling for locked segments
                        generateLabels: function () {
                            return chartDimensions.map(d =>
                                (!isUnlocked && LOCKED_DIMENSIONS.includes(d.key)) ? `${d.label} 🔒` : d.label);
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            // Add click handler for locked segments
            onClick: function (event, elements) {
                if (!isUnlocked && elements.length === 0) {
                    // Click on chart but not on a point - might be trying to access locked area
                    showUnlockModal();
                }
            }
        }
    });
}

// Generate dynamic insights
function generateInsights() {
    const sectionScores = {
        'Strategy': strategyScore,
        'Operations': operationsScore,
        'Technology': technologyScore,
        'Data': dataScore,
        'Culture': cultureScore,
        'Automation': automationScore,
        ...(hasGovernance ? { 'Governance': governanceScore } : {})
    };

    const sortedSections = Object.entries(sectionScores).sort(([, a], [, b]) => b - a);

    // Filter sections by score ranges
    const strongSections = sortedSections.filter(([, score]) => score >= 70);
    const weakSections = sortedSections.filter(([, score]) => score < 50);
    const criticalSections = sortedSections.filter(([, score]) => score < 25);
    const weakestSection = sortedSections[sortedSections.length - 1];

    const insights = [];

    // Strength insight - only for scores 70% and above
    if (strongSections.length > 0) {
        const strongest = strongSections[0];
        insights.push({
            type: 'strength',
            icon: '💪',
            title: `${strongest[0]} is Your Strong Foundation`,
            description: `Your ${strongest[0].toLowerCase()} readiness score of ${strongest[1]}% represents a solid foundation. This strength can be leveraged to accelerate AI adoption across other domains.`
        });
    }

    // Critical weakness insight for scores under 25%
    if (criticalSections.length > 0) {
        const critical = criticalSections[0];
        insights.push({
            type: 'weakness',
            icon: '⚠️',
            title: `${critical[0]} Requires Immediate Attention`,
            description: `Your ${critical[0].toLowerCase()} score of ${critical[1]}% indicates a critical gap that needs strengthening before successful AI implementation. A <a href="https://calendly.com/robvoss-vossaiconsulting/30min" target="_blank" class="text-blue-600 hover:text-blue-800 underline">free 30-minute consultation with Voss AI Consulting</a> can help you quickly identify actionable solutions for this area.`
        });
    } else if (weakSections.length > 0) {
        // Regular weakness insight for scores under 50%
        const weak = weakestSection;
        insights.push({
            type: 'weakness',
            icon: '📉',
            title: `${weak[0]} Needs Strengthening`,
            description: `Your ${weak[0].toLowerCase()} score of ${weak[1]}% suggests this area requires focused improvement to support AI success. Many of these challenges have straightforward solutions - consider a <a href="https://calendly.com/robvoss-vossaiconsulting/30min" target="_blank" class="text-blue-600 hover:text-blue-800 underline">free 30-minute consultation with Voss AI Consulting</a> to explore quick wins and actionable next steps.`
        });
    }

    // Overall insight
    let overallInsight;
    if (overallScore >= 70) {
        overallInsight = {
            type: 'opportunity',
            icon: '🎯',
            title: 'Well-Positioned for AI Success',
            description: `With an overall readiness score of ${overallScore}%, your organization shows strong potential for successful AI implementation. Focus on addressing specific gaps to maximize impact.`
        };
    } else if (overallScore >= 50) {
        overallInsight = {
            type: 'opportunity',
            icon: '📈',
            title: 'Solid Foundation with Growth Areas',
            description: `Your ${overallScore}% readiness score indicates good potential with some areas needing development. Strategic improvements in key areas will position you for AI success.`
        };
    } else if (overallScore >= 25) {
        overallInsight = {
            type: 'opportunity',
            icon: '🌱',
            title: 'Foundational Development Needed',
            description: `Your ${overallScore}% score indicates significant opportunity for improvement across multiple areas. This is a teachable moment with tremendous potential for AI transformation as you build foundational capabilities. A <a href="https://calendly.com/robvoss-vossaiconsulting/30min" target="_blank" class="text-blue-600 hover:text-blue-800 underline">free consultation</a> can help prioritize your development efforts.`
        };
    } else {
        overallInsight = {
            type: 'opportunity',
            icon: '🎓',
            title: 'Starting Your AI Journey',
            description: `Your ${overallScore}% score means you're at the beginning of your AI readiness journey. This presents an opportunity to build AI capabilities with best practices from the ground up. A <a href="https://calendly.com/robvoss-vossaiconsulting/30min" target="_blank" class="text-blue-600 hover:text-blue-800 underline">free 30-minute consultation</a> can provide a clear roadmap for getting started.`
        };
    }

    insights.push(overallInsight);

    return insights;
}

// Render insights
function renderInsights() {
    const insights = generateInsights();
    const container = document.getElementById('dynamicInsights');

    insights.forEach(insight => {
        const insightDiv = document.createElement('div');
        insightDiv.className = `insight-card ${insight.type}`;

        insightDiv.innerHTML = `
                    <div class="flex items-start">
                        <span class="text-3xl mr-4">${insight.icon}</span>
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2 text-lg">${insight.title}</h4>
                            <p class="text-gray-700">${insight.description}</p>
                        </div>
                    </div>
                `;

        container.appendChild(insightDiv);
    });
}

// Generate action plan
function generateActionPlan() {
    const actions = {
        immediate: [],
        shortTerm: [],
        longTerm: []
    };

    // Generate actions based on scores
    if (strategyScore < 70) {
        actions.immediate.push("Define clear AI vision and objectives");
        actions.shortTerm.push("Develop comprehensive AI strategy document");
    }

    if (dataScore < 70) {
        actions.immediate.push("Audit current data quality and accessibility");
        actions.shortTerm.push("Implement data governance framework");
    }

    if (technologyScore < 70) {
        actions.shortTerm.push("Assess and upgrade IT infrastructure");
        actions.longTerm.push("Implement cloud-first AI architecture");
    }

    if (cultureScore < 70) {
        actions.immediate.push("Launch AI awareness training program");
        actions.shortTerm.push("Build change management capabilities");
    }

    if (hasGovernance && governanceScore < 70) {
        actions.immediate.push("Publish an AI acceptable-use policy and approved-tools list");
        actions.shortTerm.push("Set rules and oversight for AI agents and client data");
    }

    // Default actions if scores are good
    if (actions.immediate.length === 0) {
        actions.immediate.push("Identify pilot AI use cases");
        actions.immediate.push("Form AI governance committee");
    }

    if (actions.shortTerm.length === 0) {
        actions.shortTerm.push("Launch first AI pilot project");
        actions.shortTerm.push("Establish AI success metrics");
    }

    if (actions.longTerm.length === 0) {
        actions.longTerm.push("Scale successful AI implementations");
        actions.longTerm.push("Build AI center of excellence");
    }

    return actions;
}

// Render action plan
function renderActionPlan(actions = generateActionPlan()) {
    const container = document.getElementById('actionPlan');
    container.innerHTML = '';

    const timeframes = [
        { key: 'immediate', title: '🚀 Immediate (0-30 days)', color: 'yellow' },
        { key: 'shortTerm', title: '📈 Short-term (30-90 days)', color: 'blue' },
        { key: 'longTerm', title: '🎯 Long-term (90+ days)', color: 'green' }
    ];

    timeframes.forEach(timeframe => {
        const actionDiv = document.createElement('div');
        actionDiv.className = `bg-${timeframe.color}-50 rounded-lg p-4`;

        let actionsHTML = '';
        actions[timeframe.key].forEach(action => {
            actionsHTML += `<li class="text-sm text-gray-700 mb-2">• ${escapeHtml(action)}</li>`;
        });

        actionDiv.innerHTML = `
                    <h4 class="font-semibold text-${timeframe.color}-800 mb-3">${timeframe.title}</h4>
                    <ul class="space-y-1">${actionsHTML}</ul>
                `;

        container.appendChild(actionDiv);
    });
}

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Unlock Modal Functions
function showUnlockModal() {
    const modal = document.getElementById('unlockModal');
    modal.classList.add('active');

    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
}

document.getElementById('unlockButton').addEventListener('click', showUnlockModal);

function closeUnlockModal() {
    const modal = document.getElementById('unlockModal');
    modal.classList.remove('active');

    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
}

document.getElementById('secondaryButton').addEventListener('click', closeUnlockModal);

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeUnlockModal();
    }
}

function unlockResults() {
    // Open Calendly link
    window.open('https://calendly.com/robvoss-vossaiconsulting/30min', '_blank');

    // Optional: Actually unlock the results after booking
    // For now, we'll just close the modal
    closeUnlockModal();

    // You could add logic here to actually unlock if you want
    // unlockFullResults();
}

document.getElementById('primaryCta').addEventListener('click', unlockResults);

function unlockFullResults() {
    isUnlocked = true;

    // Hide the chart overlay
    const overlay = document.getElementById('chartOverlay');
    overlay.style.display = 'none';

    // Update the score cards to show hidden scores
    document.getElementById('dataScore').textContent = `${dataScore}%`;
    document.getElementById('automationScore').textContent = `${automationScore}%`;

    // Recreate the radar chart with all data
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }
    createRadarChart();

    // Show success message
    setTimeout(() => {
        alert('🎉 Full results unlocked! You can now see your complete AI readiness profile.');
    }, 500);
}

// Record results first so the report can attach its consultant brief to the new CRM contact
async function initReportFlow() {
    if (hasRealData) {
        await sendResultsToDataCollection();
    }
    await loadAiReport();
}

initRoiCalculator();
initReportFlow();

// Initialize everything
setTimeout(() => {
    // A blocked chart CDN shouldn't take the insights and action plan down with it
    if (typeof Chart !== 'undefined') {
        createRadarChart();
    }
    renderInsights();
    renderActionPlan(personalizedRoadmap || generateActionPlan());

    // Show unlock modal after 10 seconds if not unlocked
    setTimeout(() => {
        if (!isUnlocked) {
            showUnlockModal();
        }
    }, 10000);
}, 1000);

// Make functions available globally
window.showUnlockModal = showUnlockModal;
window.closeUnlockModal = closeUnlockModal;
window.unlockResults = unlockResults;
window.unlockFullResults = unlockFullResults;