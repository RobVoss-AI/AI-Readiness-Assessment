-- Seed data for AI Opportunity Scorecard
-- Run this after creating schema and policies

-- Insert question sections
INSERT INTO question_sections (id, title, description, weight, order_index) VALUES
('strategy', 'AI Strategy & Vision', 'Assess your organization''s strategic approach to AI adoption', 1.2, 1),
('data', 'Data Infrastructure', 'Evaluate your data readiness and quality for AI initiatives', 1.3, 2),
('technology', 'Technology Capabilities', 'Review your technical infrastructure and AI tools', 1.1, 3),
('talent', 'AI Talent & Skills', 'Assess your team''s AI capabilities and development needs', 1.4, 4),
('culture', 'Organizational Culture', 'Evaluate cultural readiness for AI transformation', 1.0, 5),
('governance', 'AI Governance & Ethics', 'Review your AI governance, ethics, and risk management', 1.2, 6);

-- Insert sample questions (based on your coreQuestions.json)
INSERT INTO questions (id, section_id, type, question, options, weight, required, roles, industries, help_text, order_index) VALUES
('strategy_vision', 'strategy', 'likert', 'Our organization has a clear, documented vision for how AI will create business value', 
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb, 
 1.5, true, '["all"]'::jsonb, '["all"]'::jsonb, 
 'A clear AI vision aligns initiatives with business goals', 1),

('strategy_roadmap', 'strategy', 'likert', 'We have a detailed roadmap for AI implementation across our organization',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.3, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'An AI roadmap provides clear milestones and priorities', 2),

('data_quality', 'data', 'likert', 'Our data is clean, well-organized, and readily accessible for analysis',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.4, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'High-quality data is essential for successful AI implementation', 1),

('data_governance', 'data', 'likert', 'We have established data governance policies and procedures',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.2, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'Data governance ensures compliance and quality standards', 2),

('tech_infrastructure', 'technology', 'likert', 'Our current technology infrastructure can support AI workloads',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.3, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'Adequate infrastructure is crucial for AI performance', 1),

('talent_skills', 'talent', 'likert', 'Our team has the necessary AI and data science skills',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.5, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'AI talent is often the biggest constraint for organizations', 1),

('culture_innovation', 'culture', 'likert', 'Our organizational culture embraces innovation and experimentation',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.2, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'Innovation culture accelerates AI adoption', 1),

('governance_ethics', 'governance', 'likert', 'We have established AI ethics guidelines and review processes',
 '["Strongly Disagree", "Disagree", "Unsure", "Agree", "Strongly Agree"]'::jsonb,
 1.3, true, '["all"]'::jsonb, '["all"]'::jsonb,
 'AI ethics are crucial for responsible deployment', 1);

-- Insert industry modules
INSERT INTO industry_modules (id, name, description, additional_questions, weight_adjustments) VALUES
('healthcare', 'Healthcare', 'Healthcare-specific AI considerations including HIPAA compliance and patient safety',
 '["healthcare_compliance", "healthcare_safety"]'::jsonb,
 '{"data_governance": 1.5, "governance_ethics": 1.4}'::jsonb),

('finance', 'Financial Services', 'Financial services AI requirements including regulatory compliance and risk management',
 '["finance_risk", "finance_regulation"]'::jsonb,
 '{"governance_ethics": 1.3, "data_governance": 1.4}'::jsonb),

('manufacturing', 'Manufacturing', 'Manufacturing AI applications including predictive maintenance and quality control',
 '["manufacturing_automation", "manufacturing_quality"]'::jsonb,
 '{"technology": 1.3, "data_quality": 1.2}'::jsonb),

('retail', 'Retail & E-commerce', 'Retail AI use cases including personalization and inventory optimization',
 '["retail_personalization", "retail_inventory"]'::jsonb,
 '{"data_quality": 1.3, "culture_innovation": 1.2}'::jsonb);

-- Insert sample benchmarks
INSERT INTO benchmarks (id, industry, company_size, metric_name, metric_value, percentile_25, percentile_50, percentile_75, percentile_90, sample_size) VALUES
('overall_readiness_small_tech', 'technology', 'small', 'overall_ai_readiness', 65.5, 45.0, 62.0, 78.0, 85.0, 250),
('overall_readiness_medium_tech', 'technology', 'medium', 'overall_ai_readiness', 72.3, 55.0, 70.0, 82.0, 90.0, 180),
('overall_readiness_large_tech', 'technology', 'large', 'overall_ai_readiness', 78.8, 65.0, 77.0, 87.0, 94.0, 120),

('data_readiness_small_healthcare', 'healthcare', 'small', 'data_infrastructure', 58.2, 35.0, 55.0, 70.0, 80.0, 150),
('data_readiness_medium_healthcare', 'healthcare', 'medium', 'data_infrastructure', 64.7, 45.0, 62.0, 75.0, 85.0, 200),
('data_readiness_large_healthcare', 'healthcare', 'large', 'data_infrastructure', 71.5, 55.0, 68.0, 80.0, 88.0, 100),

('talent_readiness_small_finance', 'finance', 'small', 'ai_talent', 52.3, 30.0, 50.0, 65.0, 75.0, 180),
('talent_readiness_medium_finance', 'finance', 'medium', 'ai_talent', 61.8, 40.0, 58.0, 72.0, 82.0, 220),
('talent_readiness_large_finance', 'finance', 'large', 'ai_talent', 69.4, 50.0, 66.0, 78.0, 86.0, 150);