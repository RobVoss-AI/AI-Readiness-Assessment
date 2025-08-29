
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
let answers = {};
let currentSection = 0;

// Assessment sections with comprehensive questions
const sections = [
    {
        id: 'strategy',
        title: 'AI Strategy & Vision',
        description: 'Assess your organization\'s strategic approach to AI adoption',
        questions: [
            { id: 'strategy_vision', text: 'Our organization has a clear, documented vision for how AI will create business value' },
            { id: 'strategy_problems', text: 'We have identified specific, measurable business problems that AI could help solve' },
            { id: 'strategy_leadership', text: 'Our leadership team actively champions and supports AI initiatives' },
            { id: 'strategy_budget', text: 'We have allocated appropriate budget and resources for AI implementation' },
            { id: 'strategy_culture', text: 'Our organization has a culture that embraces innovation and technological change' },
            { id: 'strategy_open', text: 'What is your biggest strategic challenge or opportunity when it comes to AI adoption?', type: 'textarea' }
        ]
    },
    {
        id: 'operations',
        title: 'Operational Readiness',
        description: 'Evaluate how well your operations can integrate AI solutions',
        questions: [
            { id: 'ops_process_mapping', text: 'We have documented and mapped our key business processes in detail' },
            { id: 'ops_automation_candidates', text: 'We have identified repetitive, rule-based tasks that could be automated' },
            { id: 'ops_change_readiness', text: 'Our operational teams are receptive to process changes enabled by AI' },
            { id: 'ops_efficiency_measurement', text: 'We have clear metrics to measure operational efficiency improvements' },
            { id: 'ops_open', text: 'What specific operational processes or tasks would you most like to improve with AI?', type: 'textarea' }
        ]
    },
    {
        id: 'technology',
        title: 'Technology Infrastructure',
        description: 'Assess your technical readiness for AI implementation',
        questions: [
            { id: 'tech_infrastructure', text: 'Our current IT infrastructure can support AI applications and workloads' },
            { id: 'tech_cloud_experience', text: 'We have experience with cloud computing platforms and services' },
            { id: 'tech_data_systems', text: 'Our data systems are well-integrated and accessible for AI applications' },
            { id: 'tech_security', text: 'We have robust cybersecurity measures in place for AI systems' },
            { id: 'tech_open', text: 'What are your biggest technology concerns or gaps when it comes to implementing AI?', type: 'textarea' }
        ]
    },
    {
        id: 'data',
        title: 'Data Quality & Governance',
        description: 'Evaluate your data readiness for AI applications',
        questions: [
            { id: 'data_quality', text: 'We have high-quality, well-structured data available for AI projects' },
            { id: 'data_accessibility', text: 'Our data is well-organized and easily accessible to relevant teams' },
            { id: 'data_governance', text: 'We have strong data governance policies and procedures in place' },
            { id: 'data_privacy', text: 'We have clear data privacy and compliance frameworks established' },
            { id: 'data_open', text: 'What data challenges or opportunities do you see for AI implementation in your organization?', type: 'textarea' }
        ]
    },
    {
        id: 'culture',
        title: 'Organizational Culture',
        description: 'Assess cultural readiness for AI adoption and change',
        questions: [
            { id: 'culture_enthusiasm', text: 'Our employees are generally enthusiastic about AI adoption and its potential' },
            { id: 'culture_change_embrace', text: 'We have a culture that embraces and adapts well to technological change' },
            { id: 'culture_learning', text: 'Our organization prioritizes continuous learning and skill development' },
            { id: 'culture_collaboration', text: 'We foster collaboration between technical and business teams' },
            { id: 'culture_open', text: 'What do you imagine AI could do for your organization?', type: 'textarea' }
        ]
    },
    {
        id: 'automation',
        title: 'Automation Readiness',
        description: 'Identify current automation experience and opportunities',
        questions: [
            { id: 'auto_current_state', text: 'We have already implemented some form of process automation' },
            { id: 'auto_employee_understanding', text: 'Our employees understand how automation enhances rather than replaces their work' },
            { id: 'auto_tools_experience', text: 'We have experience with automation tools and technologies' },
            { id: 'auto_roi_measurement', text: 'We can measure and demonstrate ROI from automation initiatives' },
            { id: 'auto_open', text: 'What would be your ideal first automation project or AI use case?', type: 'textarea' }
        ]
    }
];

// Clear any existing answers to start fresh
answers = {};
storage.setItem("voss_answers", "{}");
storage.setItem("voss_scores", "{}");

// Select answer function
function selectAnswer(questionId, value) {
    // Sanitize text inputs
    if (typeof value === 'string') {
        value = SecurityUtils.sanitizeText(value);
    }

    answers[questionId] = value;
    storage.setItem("voss_answers", JSON.stringify(answers));

    // Update UI
    const questionCard = document.querySelector(`[data-question-id="${questionId}"]`);
    if (questionCard) {
        questionCard.querySelectorAll('.likert-option').forEach(btn => btn.classList.remove('selected'));
        const selectedButton = questionCard.querySelector(`[data-value="${value}"]`);
        if (selectedButton) selectedButton.classList.add('selected');
    }

    updateProgress();
}

// Event delegation for button clicks
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('likert-option') || e.target.parentNode.classList.contains('likert-option')) {
        const button = e.target.classList.contains('likert-option') ? e.target : e.target.parentNode;
        const questionCard = button.closest('.question-card');
        if (!questionCard) return;

        const questionId = questionCard.getAttribute('data-question-id');
        const value = parseInt(button.getAttribute('data-value'));

        if (questionId && !isNaN(value)) {
            selectAnswer(questionId, value);
        }
    }
});

// Event delegation for textarea inputs
document.addEventListener('input', function (e) {
    if (e.target.tagName === 'TEXTAREA' && e.target.hasAttribute('data-question-id')) {
        const questionId = e.target.getAttribute('data-question-id');
        const value = e.target.value.trim();

        if (questionId) {
            selectAnswer(questionId, value);
        }
    }
});

// Update progress
function updateProgress() {
    const section = sections[currentSection];
    // Only count Likert scale questions for progress/validation (not textarea questions)
    const likertQuestions = section.questions.filter(q => q.type !== 'textarea');
    const answeredQuestions = likertQuestions.filter(q => answers[q.id] !== undefined).length;
    const sectionProgress = (currentSection + (answeredQuestions / likertQuestions.length)) / sections.length;
    const progressPercent = Math.round(sectionProgress * 100);

    document.getElementById('progressBar').style.width = progressPercent + '%';
    document.getElementById('progressPercent').textContent = progressPercent + '% Complete';
    document.getElementById('sectionInfo').textContent = `Section ${currentSection + 1} of ${sections.length}`;

    // Update buttons
    document.getElementById('prevButton').disabled = currentSection === 0;
    const nextButton = document.getElementById('nextButton');

    // Show how many Likert questions are answered in current section
    const allAnswered = answeredQuestions === likertQuestions.length;
    if (allAnswered) {
        nextButton.textContent = currentSection === sections.length - 1 ? 'See Results →' : 'Next Section →';
        nextButton.disabled = false;
    } else {
        nextButton.textContent = `Answer Required Questions (${answeredQuestions}/${likertQuestions.length})`;
        nextButton.disabled = false; // Allow clicking to show validation message
    }
}

// Render section
function renderSection() {
    const section = sections[currentSection];

    // Update header
    document.getElementById('sectionTitle').textContent = section.title;
    document.getElementById('sectionDescription').textContent = section.description;

    // Build questions HTML
    let questionsHTML = '';
    section.questions.forEach((question, index) => {
        const isSelected = answers[question.id];

        questionsHTML += `
                    <div class="question-card" data-question-id="${question.id}">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">
                            <span class="text-blue-600 font-bold">${index + 1}.</span> 
                            ${question.text}
                            ${question.type === 'textarea' ? '<span class="text-gray-500 ml-1">(Optional)</span>' : '<span class="text-red-500 ml-1">*</span>'}
                        </h3>
                `;

        if (question.type === 'textarea') {
            // Open-ended text question - sanitize text content
            const textValue = (answers[question.id] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            questionsHTML += `
                        <textarea 
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical" 
                            rows="4" 
                            placeholder="Share your thoughts..."
                            data-question-id="${question.id}"
                        >${textValue}</textarea>
                    `;
        } else {
            // Likert scale question
            questionsHTML += '<div class="likert-container">';
            const labels = ['Strongly Disagree', 'Disagree', 'Unsure', 'Agree', 'Strongly Agree'];
            for (let j = 0; j < 5; j++) {
                const selected = isSelected === j ? ' selected' : '';
                questionsHTML += `
                            <button type="button" class="likert-option${selected}" data-value="${j}">
                                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">${j + 1}</div>
                                <div style="font-size: 0.65rem; line-height: 1.1; font-weight: 500;">${labels[j]}</div>
                            </button>
                        `;
            }
            questionsHTML += '</div>';
        }

        questionsHTML += '</div>';
    });

    document.getElementById('questionsContainer').innerHTML = questionsHTML;
    updateProgress();
}

// Navigation handlers
document.getElementById('nextButton').addEventListener('click', function () {
    // Check if all required (Likert scale) questions in current section are answered
    const section = sections[currentSection];
    const likertQuestions = section.questions.filter(q => q.type !== 'textarea');
    const unansweredQuestions = likertQuestions.filter(q => answers[q.id] === undefined);

    if (unansweredQuestions.length > 0) {
        alert(`Please answer all ${likertQuestions.length} required questions before proceeding to the next section. (Open-ended questions are optional)`);
        // Scroll to first unanswered question
        const firstUnanswered = document.querySelector(`[data-question-id="${unansweredQuestions[0].id}"]`);
        if (firstUnanswered) {
            firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstUnanswered.style.border = '2px solid #ef4444';
            setTimeout(() => {
                firstUnanswered.style.border = '';
            }, 3000);
        }
        return;
    }

    // Calculate section score
    let sectionScore = 0;
    let answeredQuestions = 0;

    section.questions.forEach(question => {
        if (question.type !== 'textarea' && answers[question.id] !== undefined) {
            sectionScore += (answers[question.id] / 4) * 100;
            answeredQuestions++;
        }
        // Note: Textarea questions don't contribute to scoring
    });

    const avgScore = answeredQuestions > 0 ? Math.round(sectionScore / answeredQuestions) : 0;

    // Save scores
    const scores = JSON.parse(storage.getItem("voss_scores") || "{}");
    scores[section.id] = avgScore;
    storage.setItem("voss_scores", JSON.stringify(scores));
    storage.setItem("voss_answers", JSON.stringify(answers));

    // Navigate
    if (currentSection < sections.length - 1) {
        currentSection++;
        renderSection();
        window.scrollTo(0, 0);
    } else {
        // Redirect to results
        window.location.href = "results-new.html";
    }
});

document.getElementById('prevButton').addEventListener('click', function () {
    if (currentSection > 0) {
        currentSection--;
        renderSection();
        window.scrollTo(0, 0);
    }
});

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Restart functionality
document.getElementById('restartButton').addEventListener('click', function () {
    if (confirm('Are you sure you want to restart the assessment? All your current answers will be lost.')) {
        // Clear all stored data
        storage.setItem('voss_answers', '{}');
        storage.setItem('voss_scores', '{}');

        // Reset to first section
        currentSection = 0;
        answers = {};

        // Re-render the first section
        renderSection();

        // Scroll to top
        window.scrollTo(0, 0);

        // Optional: Show confirmation
        const restartBtn = document.getElementById('restartButton');
        const originalText = restartBtn.textContent;
        restartBtn.textContent = '✓ Restarted';
        restartBtn.classList.add('text-green-600');

        setTimeout(() => {
            restartBtn.textContent = originalText;
            restartBtn.classList.remove('text-green-600');
            restartBtn.classList.add('text-blue-600');
        }, 2000);
    }
});

// Initialize
renderSection();