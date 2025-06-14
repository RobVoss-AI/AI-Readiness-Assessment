const hubspot = require('@hubspot/api-client');

class HubSpotClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    initialize() {
        try {
            const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

            if (!accessToken) {
                console.warn('⚠️  HubSpot access token not found in environment variables');
                console.warn('   Add HUBSPOT_ACCESS_TOKEN to .env to enable lead management');
                return null;
            }

            this.client = new hubspot.Client({ accessToken });
            this.isConnected = true;
            console.log('✅ HubSpot client initialized');
            return this.client;
        } catch (error) {
            console.error('❌ Failed to initialize HubSpot:', error.message);
            this.isConnected = false;
            return null;
        }
    }

    // Create contact from assessment completion
    async createContactFromAssessment(assessmentData, userInfo, score, sectionScores) {
        if (!this.client) return null;

        try {
            const contactProperties = {
                email: userInfo.email,
                firstname: userInfo.firstName || '',
                lastname: userInfo.lastName || '',
                company: userInfo.company || '',
                jobtitle: userInfo.jobTitle || '',
                phone: userInfo.phone || '',
                industry: userInfo.industry || '',
                // Custom properties for AI assessment
                ai_readiness_score: score.toString(),
                ai_assessment_completed_date: new Date().toISOString().split('T')[0],
                company_size: userInfo.companySize || '',
                ai_strategy_score: sectionScores?.strategy?.toString() || '',
                ai_data_score: sectionScores?.data?.toString() || '',
                ai_technology_score: sectionScores?.technology?.toString() || '',
                ai_talent_score: sectionScores?.talent?.toString() || '',
                ai_culture_score: sectionScores?.culture?.toString() || '',
                ai_governance_score: sectionScores?.governance?.toString() || '',
                // Lead source tracking
                lead_source: 'AI Readiness Assessment',
                assessment_url: process.env.ASSESSMENT_SUBDOMAIN || 'assessment.vossaiconsulting.com'
            };

            const response = await this.client.crm.contacts.basicApi.create({
                properties: contactProperties
            });

            console.log('✅ HubSpot contact created:', response.id);
            return response;
        } catch (error) {
            console.error('❌ HubSpot contact creation failed:', error.message);
            return null;
        }
    }

    // Create deal for high-scoring assessments
    async createDealFromAssessment(contactId, assessmentData, score, userInfo) {
        if (!this.client) return null;

        try {
            // Only create deals for scores above threshold
            const dealThreshold = parseFloat(process.env.HUBSPOT_DEAL_THRESHOLD || '70');
            if (score < dealThreshold) {
                console.log(`Score ${score} below deal threshold ${dealThreshold}, skipping deal creation`);
                return null;
            }

            const dealProperties = {
                dealname: `AI Consulting - ${userInfo.company || userInfo.email}`,
                pipeline: process.env.HUBSPOT_PIPELINE_ID || 'default',
                dealstage: process.env.HUBSPOT_INITIAL_STAGE || 'appointmentscheduled',
                amount: this.calculateDealValue(score, userInfo.companySize),
                closedate: this.calculateCloseDate(),
                ai_readiness_score: score.toString(),
                lead_source: 'AI Readiness Assessment',
                deal_type: 'AI Consulting Services'
            };

            const dealResponse = await this.client.crm.deals.basicApi.create({
                properties: dealProperties
            });

            // Associate deal with contact
            if (contactId && dealResponse.id) {
                await this.client.crm.deals.associationsApi.create(
                    dealResponse.id,
                    'contacts',
                    contactId,
                    'deal_to_contact'
                );
            }

            console.log('✅ HubSpot deal created:', dealResponse.id);
            return dealResponse;
        } catch (error) {
            console.error('❌ HubSpot deal creation failed:', error.message);
            return null;
        }
    }

    // Update contact with additional assessment data
    async updateContactAssessment(email, assessmentId, additionalData = {}) {
        if (!this.client) return null;

        try {
            const updateProperties = {
                last_assessment_id: assessmentId,
                last_assessment_date: new Date().toISOString().split('T')[0],
                ...additionalData
            };

            const response = await this.client.crm.contacts.basicApi.update(
                email,
                { properties: updateProperties },
                undefined,
                'email'
            );

            console.log('✅ HubSpot contact updated');
            return response;
        } catch (error) {
            console.error('❌ HubSpot contact update failed:', error.message);
            return null;
        }
    }

    // Get contact by email
    async getContactByEmail(email) {
        if (!this.client) return null;

        try {
            const response = await this.client.crm.contacts.basicApi.getById(
                email,
                ['email', 'firstname', 'lastname', 'ai_readiness_score'],
                undefined,
                undefined,
                false,
                'email'
            );

            return response;
        } catch (error) {
            if (error.code === 404) {
                return null; // Contact doesn't exist
            }
            console.error('❌ HubSpot contact lookup failed:', error.message);
            return null;
        }
    }

    // Helper: Calculate deal value based on score and company size
    calculateDealValue(score, companySize) {
        const baseValues = {
            'small': 25000,
            'medium': 75000,
            'large': 150000,
            'enterprise': 300000
        };

        const baseValue = baseValues[companySize] || baseValues['medium'];
        
        // Increase value for higher scores (more likely to close)
        const scoreMultiplier = score > 80 ? 1.3 : score > 60 ? 1.1 : 1.0;
        
        return Math.round(baseValue * scoreMultiplier);
    }

    // Helper: Calculate estimated close date
    calculateCloseDate() {
        const closeDate = new Date();
        closeDate.setDate(closeDate.getDate() + 30); // 30 days from now
        return closeDate.toISOString().split('T')[0];
    }

    // Add note to contact about assessment
    async addAssessmentNote(contactId, score, keyInsights, freeResponses = null) {
        if (!this.client) return null;

        try {
            let noteContent = `AI Readiness Assessment completed with score: ${score}/100

Key Insights:
${keyInsights.map(insight => `• ${insight}`).join('\n')}`;

            // Add free-text responses if provided
            if (freeResponses && Object.keys(freeResponses).length > 0) {
                noteContent += `\n\nOpen-Ended Responses:`;
                
                const responseLabels = {
                    strategy_open: 'Strategic AI Priorities',
                    ops_open: 'Operational Bottlenecks', 
                    tech_open: 'Technology Challenges',
                    data_open: 'Data Infrastructure Concerns',
                    culture_open: 'Cultural Barriers',
                    auto_open: 'Automation Opportunities'
                };

                Object.entries(freeResponses).forEach(([key, value]) => {
                    if (value && value.trim()) {
                        const label = responseLabels[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        noteContent += `\n\n${label}:\n"${value.trim()}"`;
                    }
                });
            }

            noteContent += `\n\nAssessment completed on ${new Date().toLocaleDateString()}`;

            const response = await this.client.crm.objects.notes.basicApi.create({
                properties: {
                    hs_note_body: noteContent,
                    hs_timestamp: Date.now()
                },
                associations: [
                    {
                        to: { id: contactId },
                        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
                    }
                ]
            });

            console.log('✅ HubSpot note added with free responses');
            return response;
        } catch (error) {
            console.error('❌ HubSpot note creation failed:', error.message);
            return null;
        }
    }
}

const hubspotClient = new HubSpotClient();

module.exports = hubspotClient;