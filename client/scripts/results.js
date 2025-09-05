console.log('🟢 Results-new.html JavaScript loaded and running');

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

// Load data
let userData = null;
let scores = null;

try {
    console.log('=== LOADING DATA FROM STORAGE ===');
    console.log('Raw voss_user from storage:', storage.getItem("voss_user"));
    console.log('Raw voss_scores from storage:', storage.getItem("voss_scores"));
    console.log('Raw voss_answers from storage:', storage.getItem("voss_answers"));

    userData = JSON.parse(storage.getItem("voss_user") || "null");
    scores = JSON.parse(storage.getItem("voss_scores") || "null");

    console.log('Parsed userData:', userData);
    console.log('Parsed scores:', scores);
} catch (e) {
    console.error('Error parsing data:', e);
}

// Fallback data if needed
if (!userData) {
    userData = {
        firstName: 'User',
        email: 'user@example.com',
        industry: 'Technology',
        jobTitle: 'Manager',
        role: 'Manager'
    };
}

if (!scores) {
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
            automation: 65
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
        automation: ['auto_current_state', 'auto_employee_understanding', 'auto_tools_experience', 'auto_roi_measurement']
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

document.getElementById("strategyScore").textContent = `${strategyScore}%`;
document.getElementById("operationsScore").textContent = `${operationsScore}%`;
document.getElementById("technologyScore").textContent = `${technologyScore}%`;
document.getElementById("dataScore").textContent = `${dataScore}%`;
document.getElementById("cultureScore").textContent = `${cultureScore}%`;
document.getElementById("automationScore").textContent = `${automationScore}%`;

// Calculate overall score
const overallScore = Math.round(
    (strategyScore + operationsScore + technologyScore + dataScore + cultureScore + automationScore) / 6
);

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

// Send results to data collection services
async function sendResultsToDataCollection() {
    // Get assessment answers to extract free responses
    const answers = JSON.parse(storage.getItem("voss_answers") || "{}");
    const freeResponses = {
        strategy_open: answers.strategy_open || '',
        ops_open: answers.ops_open || '',
        tech_open: answers.tech_open || '',
        data_open: answers.data_open || '',
        culture_open: answers.culture_open || '',
        auto_open: answers.auto_open || '',
        // Legacy support for older question names (map them to the current answers)
        strategy_priorities: answers.strategy_open || '',
        ops_bottlenecks: answers.ops_open || '',
        culture_barriers: answers.culture_open || '',
        auto_specific_tasks: answers.auto_open || ''
    };

    const completeData = {
        type: 'assessment_results',
        timestamp: new Date().toISOString(),
        user: userData,
        scores: {
            strategy: strategyScore,
            operations: operationsScore,
            technology: technologyScore,
            data: dataScore,
            culture: cultureScore,
            automation: automationScore,
            overall: overallScore
        },
        freeResponses: freeResponses,
        readinessLevel: readinessLevel,
        allAnswers: answers
    };

    console.log('🚀 Attempting to send results to data collection...');
    console.log('=== RESULTS PAGE DEBUGGING ===');
    console.log('Complete data package:', completeData);

    // Try multiple collection methods
    const results = await Promise.allSettled([
        sendToWebhook(completeData),
        sendToGoogleSheets(completeData),
        sendToLocalStorage(completeData)
    ]);

    console.log('Data collection results:', results);
    return results.some(result => result.status === 'fulfilled' && result.value === true);
}

// Method 1: Backend API (most reliable)
async function sendToWebhook(data) {
    try {
        // Using the local backend API for data collection
        // Environment-aware API configuration
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001/api'
            : 'https://api.vossaiconsulting.com/api';

        console.log('API Base URL:', API_BASE);

        const response = await fetch(`${API_BASE}/results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('✅ Data sent to backend API successfully');
            return true;
        } else {
            console.error('❌ Backend API returned error status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Backend API failed:', error);
        return false;
    }
}

// Method 2: Backend API (backup - same as primary)
async function sendToGoogleSheets(data) {
    // Environment-aware API configuration
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://api.vossaiconsulting.com/api';
    const BACKEND_API_URL = `${API_BASE}/results`;

    console.log('API Base URL:', API_BASE);

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('✅ Data sent to backend API (backup method) successfully');
            return true;
        } else {
            console.error('❌ Backend API (backup method) returned error status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Backend API (backup method) failed:', error);
        return false;
    }
}

// Method 3: Local storage backup (always works)
async function sendToLocalStorage(data) {
    try {
        const existingData = JSON.parse(storage.getItem('voss_assessment_results') || '[]');
        existingData.push(data);
        storage.setItem('voss_assessment_results', JSON.stringify(existingData));

        // Also create a human-readable summary
        const summary = `
Assessment Results - ${data.timestamp}
` +
            `Name: ${data.user.firstName}
` +
            `Email: ${data.user.email}
` +
            `Industry: ${data.user.industry}
` +
            `Job Title: ${data.user.jobTitle}
` +
            `Overall Score: ${data.scores.overall}%
` +
            `Individual Scores:
` +
            `  Strategy: ${data.scores.strategy}%
` +
            `  Operations: ${data.scores.operations}%
` +
            `  Technology: ${data.scores.technology}%
` +
            `  Data: ${data.scores.data}%
` +
            `  Culture: ${data.scores.culture}%
` +
            `  Automation: ${data.scores.automation}%
` +
            `Free Responses:
` +
            `  Strategy: ${data.freeResponses.strategy_open}
` +
            `  Operations: ${data.freeResponses.ops_open}
` +
            `  Technology: ${data.freeResponses.tech_open}
` +
            `  Data: ${data.freeResponses.data_open}
` +
            `  Culture: ${data.freeResponses.culture_open}
` +
            `  Automation: ${data.freeResponses.auto_open}
`;

        storage.setItem('voss_latest_summary', summary);
        console.log('✅ Data saved to local storage successfully');
        console.log('Summary:', summary);
        return true;
    } catch (error) {
        console.error('❌ Local storage failed:', error);
        return false;
    }
}

// Send results when page loads
console.log('🔄 Results page loaded, about to call sendResultsToDataCollection...');
sendResultsToDataCollection();

// Also provide a manual trigger for debugging
window.manualDataSend = () => {
    console.log('🔄 Manual data send triggered...');
    sendResultsToDataCollection();
};

// Show data summary in console for debugging
window.showDataSummary = () => {
    const summary = storage.getItem('voss_latest_summary');
    console.log('Latest assessment summary:', summary);
    return summary;
};

// Global variables for unlock functionality
let isUnlocked = false;
let radarChartInstance = null;

// Create radar chart (initially with hidden segments)
function createRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');

    // Initially show only 4 segments, hide Data and Automation
    const chartData = isUnlocked
        ? [strategyScore, operationsScore, technologyScore, dataScore, cultureScore, automationScore]
        : [strategyScore, operationsScore, technologyScore, null, cultureScore, null];

    const chartLabels = ['Strategy', 'Operations', 'Technology', 'Data', 'Culture', 'Automation'];

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
                        generateLabels: function (chart) {
                            const labels = ['Strategy', 'Operations', 'Technology', 'Data', 'Culture', 'Automation'];
                            return labels.map((label, index) => {
                                if (!isUnlocked && (index === 3 || index === 5)) { // Data and Automation
                                    return `${label} 🔒`;
                                }
                                return label;
                            });
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
        'Automation': automationScore
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
function renderActionPlan() {
    const actions = generateActionPlan();
    const container = document.getElementById('actionPlan');

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
            actionsHTML += `<li class="text-sm text-gray-700 mb-2">• ${action}</li>`;
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

// Initialize everything
setTimeout(() => {
    createRadarChart();
    renderInsights();
    renderActionPlan();

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