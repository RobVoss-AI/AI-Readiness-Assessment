class QuestionManager {
    constructor() {
        this.coreQuestions = null;
        this.industryModules = null;
        this.filteredQuestions = {};
        this.userProfile = {};
    }

    /**
     * Initialize the question manager with user profile
     * @param {Object} userData - User profile data
     */
    async initialize(userData) {
        this.userProfile = userData;
        
        // Load question data (in real app, these would be API calls)
        await this.loadQuestionData();
        
        // Filter questions based on user profile
        this.filteredQuestions = this.filterQuestions();
        
        return this.filteredQuestions;
    }

    /**
     * Load core questions and industry modules
     */
    async loadQuestionData() {
        // In a real implementation, these would be API calls
        // For now, we'll use the data structures we defined
        this.coreQuestions = await this.loadCoreQuestions();
        this.industryModules = await this.loadIndustryModules();
    }

    /**
     * Filter questions based on user role and industry
     */
    filterQuestions() {
        const userRole = this.userProfile.role;
        const userIndustry = this.userProfile.industry;
        
        const filteredSections = {};

        // Process core questions
        this.coreQuestions.sections.forEach(section => {
            const filteredSection = {
                ...section,
                questions: this.filterSectionQuestions(section.questions, userRole)
            };
            
            // Add industry-specific questions if they exist
            const industryQuestions = this.getIndustryQuestions(section.id, userIndustry, userRole);
            if (industryQuestions.length > 0) {
                filteredSection.questions = [...filteredSection.questions, ...industryQuestions];
            }
            
            filteredSections[section.id] = filteredSection;
        });

        return filteredSections;
    }

    /**
     * Filter questions based on user role
     */
    filterSectionQuestions(questions, userRole) {
        return questions.filter(question => {
            // Check if question applies to user's role
            if (question.roles.includes('all') || question.roles.includes(userRole)) {
                return true;
            }
            return false;
        });
    }

    /**
     * Get industry-specific questions for a section
     */
    getIndustryQuestions(sectionId, userIndustry, userRole) {
        const industryKey = this.getIndustryKey(userIndustry);
        
        if (!industryKey || !this.industryModules[industryKey]) {
            return [];
        }

        const industryModule = this.industryModules[industryKey];
        const sectionQuestions = industryModule.additionalQuestions
            .filter(item => item.section === sectionId)
            .flatMap(item => item.questions);

        return this.filterSectionQuestions(sectionQuestions, userRole);
    }

    /**
     * Convert industry display name to key
     */
    getIndustryKey(industryName) {
        const industryMap = {
            'Finance & Banking': 'finance_banking',
            'Healthcare': 'healthcare',
            'Education': 'education',
            'Legal': 'legal',
            'Manufacturing': 'manufacturing',
            'Retail': 'retail'
        };
        
        return industryMap[industryName] || null;
    }

    /**
     * Get questions for a specific section
     */
    getSectionQuestions(sectionId) {
        return this.filteredQuestions[sectionId] || null;
    }

    /**
     * Get all sections metadata
     */
    getAllSections() {
        return Object.values(this.filteredQuestions).map(section => ({
            id: section.id,
            title: section.title,
            description: section.description,
            questionCount: section.questions.length
        }));
    }

    /**
     * Calculate section score based on answers
     */
    calculateSectionScore(sectionId, answers) {
        const section = this.filteredQuestions[sectionId];
        if (!section) return 0;

        let totalScore = 0;
        let totalWeight = 0;
        let answeredQuestions = 0;

        section.questions.forEach(question => {
            if (answers[question.id] !== undefined) {
                let questionScore = 0;
                
                if (question.type === 'likert') {
                    // Likert scale: 0-4 mapped to 0-100
                    questionScore = (answers[question.id] / 4) * 100;
                } else if (question.type === 'multiple') {
                    // Multiple choice: normalize based on option position
                    const optionCount = question.options.length;
                    questionScore = (answers[question.id] / (optionCount - 1)) * 100;
                } else if (question.type === 'text') {
                    // Text answers: award points for completion
                    questionScore = answers[question.id].trim().length > 0 ? 75 : 0;
                }
                
                // Apply question weight
                const weightedScore = questionScore * question.weight;
                totalScore += weightedScore;
                totalWeight += question.weight;
                answeredQuestions++;
            }
        });

        if (totalWeight === 0) return 0;
        
        // Apply section weight and return percentage
        const rawScore = (totalScore / totalWeight);
        return Math.round(rawScore * section.weight);
    }

    /**
     * Calculate overall AI readiness score
     */
    calculateOverallScore(allSectionScores) {
        const sectionIds = Object.keys(this.filteredQuestions);
        let totalScore = 0;
        let totalWeight = 0;

        sectionIds.forEach(sectionId => {
            const section = this.filteredQuestions[sectionId];
            const score = allSectionScores[sectionId] || 0;
            
            totalScore += score * section.weight;
            totalWeight += section.weight;
        });

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }

    /**
     * Get insights based on scores and user profile
     */
    generateInsights(sectionScores) {
        const insights = {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            recommendations: []
        };

        // Analyze section scores
        const scoreArray = Object.entries(sectionScores).map(([sectionId, score]) => ({
            sectionId,
            score,
            title: this.filteredQuestions[sectionId].title
        }));

        // Sort by score
        scoreArray.sort((a, b) => b.score - a.score);

        // Identify strengths (top 2 scores)
        insights.strengths = scoreArray.slice(0, 2).map(item => ({
            area: item.title,
            score: item.score,
            message: this.getStrengthMessage(item.sectionId, item.score)
        }));

        // Identify weaknesses (bottom 2 scores)
        insights.weaknesses = scoreArray.slice(-2).map(item => ({
            area: item.title,
            score: item.score,
            message: this.getWeaknessMessage(item.sectionId, item.score)
        }));

        // Generate role-specific recommendations
        insights.recommendations = this.getRoleSpecificRecommendations();

        // Generate industry-specific opportunities
        insights.opportunities = this.getIndustryOpportunities();

        return insights;
    }

    /**
     * Get strength-specific messaging
     */
    getStrengthMessage(sectionId, score) {
        const messages = {
            strategy: `Your strong strategic foundation (${score}%) provides excellent direction for AI initiatives.`,
            operations: `Your operational readiness (${score}%) positions you well for AI implementation.`,
            technology: `Your technology infrastructure (${score}%) can support advanced AI solutions.`,
            data: `Your data capabilities (${score}%) are a key asset for AI success.`,
            culture: `Your organizational culture (${score}%) will facilitate smooth AI adoption.`,
            automation: `Your automation experience (${score}%) provides a solid foundation for AI expansion.`
        };
        
        return messages[sectionId] || `Strong performance in this area (${score}%).`;
    }

    /**
     * Get weakness-specific messaging with actionable advice
     */
    getWeaknessMessage(sectionId, score) {
        const messages = {
            strategy: `Developing a clearer AI strategy (currently ${score}%) should be your top priority.`,
            operations: `Improving operational readiness (${score}%) will accelerate AI benefits.`,
            technology: `Strengthening technology infrastructure (${score}%) is essential for AI success.`,
            data: `Enhancing data quality and governance (${score}%) will unlock AI potential.`,
            culture: `Building cultural readiness (${score}%) is crucial for sustainable AI adoption.`,
            automation: `Expanding automation capabilities (${score}%) will create quick wins.`
        };
        
        return messages[sectionId] || `This area needs attention (${score}%).`;
    }

    /**
     * Get role-specific recommendations
     */
    getRoleSpecificRecommendations() {
        const role = this.userProfile.role;
        
        const recommendations = {
            'Team Member': [
                'Focus on building AI literacy and understanding how AI can enhance your daily work',
                'Identify repetitive tasks in your workflow that could benefit from automation',
                'Engage with AI training programs and stay current with AI tools in your field'
            ],
            'Manager': [
                'Develop a departmental AI strategy aligned with business objectives',
                'Build a business case for AI initiatives with clear ROI projections',
                'Foster an AI-positive culture within your team through education and involvement'
            ],
            'Executive': [
                'Establish organization-wide AI governance and strategic direction',
                'Allocate appropriate budget and resources for AI transformation',
                'Champion AI initiatives and communicate the vision across the organization'
            ],
            'Consultant': [
                'Leverage AI assessment frameworks to guide client recommendations',
                'Develop expertise in AI implementation methodologies and best practices',
                'Build partnerships with AI technology providers to enhance service offerings'
            ]
        };
        
        return recommendations[role] || recommendations['Team Member'];
    }

    /**
     * Get industry-specific opportunities
     */
    getIndustryOpportunities() {
        const industry = this.userProfile.industry;
        
        const opportunities = {
            'Finance & Banking': [
                'Implement AI-powered fraud detection to reduce financial losses',
                'Use predictive analytics for credit risk assessment and loan decisions',
                'Deploy chatbots for customer service to improve response times'
            ],
            'Healthcare': [
                'Leverage AI for diagnostic imaging to improve accuracy and speed',
                'Implement predictive analytics for patient outcome improvement',
                'Use AI for administrative automation to reduce costs'
            ],
            'Education': [
                'Deploy personalized learning systems to improve student outcomes',
                'Use AI for automated grading and feedback to save time',
                'Implement predictive analytics for student success intervention'
            ],
            'Legal': [
                'Use AI for document review and analysis to increase efficiency',
                'Implement contract analysis tools to reduce review time',
                'Deploy legal research AI to improve case preparation'
            ],
            'Manufacturing': [
                'Implement predictive maintenance to reduce downtime',
                'Use computer vision for quality control and defect detection',
                'Deploy AI for supply chain optimization'
            ],
            'Retail': [
                'Implement personalized recommendation engines to increase sales',
                'Use AI for inventory management and demand forecasting',
                'Deploy chatbots for customer service and support'
            ]
        };
        
        return opportunities[industry] || [
            'Identify process automation opportunities to improve efficiency',
            'Implement data analytics to gain better business insights',
            'Explore AI tools specific to your industry and use cases'
        ];
    }

    // Mock data loading functions (in real app, these would be API calls)
    async loadCoreQuestions() {
        // This would return the core question bank we defined earlier
        return {
            "metadata": {
                "version": "1.0",
                "lastUpdated": "2025-01-06",
                "description": "Modular question bank for AI Opportunity Scorecard"
            },
            "sections": [
                // ... core sections would be loaded here
                // For brevity, returning a simplified structure
            ]
        };
    }

    async loadIndustryModules() {
        // This would return the industry-specific modules we defined
        return {
            // ... industry modules would be loaded here
        };
    }

    /**
     * Validate that all required questions are answered
     */
    validateSectionAnswers(sectionId, answers) {
        const section = this.filteredQuestions[sectionId];
        if (!section) return { isValid: false, missingQuestions: [] };

        const missingQuestions = [];
        
        section.questions.forEach(question => {
            if (question.required && (answers[question.id] === undefined || answers[question.id] === '')) {
                missingQuestions.push({
                    id: question.id,
                    question: question.question
                });
            }
        });

        return {
            isValid: missingQuestions.length === 0,
            missingQuestions: missingQuestions
        };
    }

    /**
     * Get progress percentage for current assessment
     */
    getProgressPercentage(currentSectionIndex, answeredQuestions = {}) {
        const totalSections = Object.keys(this.filteredQuestions).length;
        const sectionsCompleted = currentSectionIndex;
        
        // Calculate completion of current section
        const currentSection = Object.values(this.filteredQuestions)[currentSectionIndex];
        let currentSectionProgress = 0;
        
        if (currentSection) {
            const totalQuestions = currentSection.questions.length;
            const answeredInSection = currentSection.questions.filter(q => 
                answeredQuestions[q.id] !== undefined
            ).length;
            currentSectionProgress = answeredInSection / totalQuestions;
        }
        
        const totalProgress = (sectionsCompleted + currentSectionProgress) / totalSections;
        return Math.round(totalProgress * 100);
    }
}

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionManager;
} else if (typeof window !== 'undefined') {
    window.QuestionManager = QuestionManager;
}