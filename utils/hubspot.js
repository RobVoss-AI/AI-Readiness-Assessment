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
                company_size: userInfo.companySize || userInfo.orgSize || '',
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

    // Create a deal for every assessment; the lead score decides stage and amount
    async createDealFromAssessment(contactId, score, userInfo, lead) {
        if (!this.client) return null;

        try {
            const isQualified = lead.qualified;
            const dealStageName = isQualified
                ? (process.env.HUBSPOT_QUALIFIED_STAGE || 'appointmentscheduled')
                : (process.env.HUBSPOT_UNQUALIFIED_STAGE || 'unqualified');

            const dealProperties = {
                dealname: `AI Assessment - ${userInfo.company || userInfo.email} (Tier ${lead.tier}, priority ${lead.priority})`,
                pipeline: process.env.HUBSPOT_PIPELINE_ID || 'default',
                dealstage: dealStageName,
                amount: isQualified ? lead.estimatedDealValue.toString() : '0',
                closedate: this.calculateCloseDate(),
                ai_readiness_score: score.toString(),
                lead_source: 'AI Readiness Assessment',
                deal_type: isQualified ? 'AI Consulting Services' : 'Assessment Only',
                qualification_status: isQualified ? 'Qualified' : 'Unqualified'
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
                    auto_open: 'Automation Opportunities',
                    gov_open: 'Governance & Client-Data Concerns'
                };

                Object.entries(freeResponses).forEach(([key, value]) => {
                    if (value && value.trim()) {
                        const label = responseLabels[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        noteContent += `\n\n${label}:\n"${value.trim()}"`;
                    }
                });
            }

            noteContent += `\n\nAssessment completed on ${new Date().toLocaleDateString()}`;

            const response = await this.createNote(contactId, noteContent);

            console.log('✅ HubSpot note added with free responses');
            return response;
        } catch (error) {
            console.error('❌ HubSpot note creation failed:', error.message);
            return null;
        }
    }

    async createNote(contactId, body) {
        return this.client.crm.objects.notes.basicApi.create({
            properties: {
                hs_note_body: body,
                hs_timestamp: Date.now()
            },
            associations: [
                {
                    to: { id: contactId },
                    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
                }
            ]
        });
    }

    // Internal sales brief generated alongside the client-facing AI report
    async addConsultantBriefNote(contactId, { brief, lead, roi, source }) {
        if (!this.client) return null;

        const list = (items) => items.length ? items.map(item => `• ${item}`).join('\n') : '• None noted';

        try {
            const body = `Consultant Brief (${source.model || 'rule-based'})

Lead: Tier ${lead.tier}, priority ${lead.priority}/100 (${lead.qualified ? 'qualified' : 'not qualified'})
Recommended engagement: ${brief.recommended_offer} [${brief.engagement_fit}]
Estimated first-engagement value: $${lead.estimatedDealValue.toLocaleString('en-US')}
Client's modeled AI value: ~${roi.current.weeklyHours} hrs/week (~$${roi.current.annualValue.toLocaleString('en-US')}/yr), $${roi.unlockableValue.toLocaleString('en-US')}/yr more if readiness reaches ${roi.targetReadiness}

Talking points:
${list(brief.talking_points)}

Likely objections:
${list(brief.likely_objections)}

Urgency signals:
${list(brief.urgency_signals)}`;

            const response = await this.createNote(contactId, body);
            console.log('✅ HubSpot consultant brief added');
            return response;
        } catch (error) {
            console.error('❌ HubSpot consultant brief failed:', error.message);
            return null;
        }
    }
}

const hubspotClient = new HubSpotClient();

module.exports = hubspotClient;