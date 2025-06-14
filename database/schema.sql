-- Supabase Database Schema for AI Opportunity Scorecard
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question sections table
CREATE TABLE question_sections (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id VARCHAR(100) PRIMARY KEY,
    section_id VARCHAR(50) REFERENCES question_sections(id),
    type VARCHAR(50) NOT NULL, -- 'likert', 'multiple_choice', 'text'
    question TEXT NOT NULL,
    options JSONB, -- Array of answer options
    weight DECIMAL(3,2) DEFAULT 1.0,
    required BOOLEAN DEFAULT false,
    roles JSONB DEFAULT '["all"]'::jsonb, -- Array of applicable roles
    industries JSONB DEFAULT '["all"]'::jsonb, -- Array of applicable industries
    help_text TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Industry modules table
CREATE TABLE industry_modules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    additional_questions JSONB, -- Array of question IDs specific to this industry
    weight_adjustments JSONB, -- Object with question_id: weight_multiplier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255), -- For anonymous sessions
    email VARCHAR(255), -- For cases where user isn't registered
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    answers JSONB DEFAULT '{}'::jsonb, -- Object with question_id: answer pairs
    score DECIMAL(5,2),
    section_scores JSONB, -- Object with section_id: score pairs
    industry VARCHAR(100),
    company_size VARCHAR(50),
    recommendations JSONB, -- Array of recommendation objects
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment results/reports table
CREATE TABLE assessment_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id),
    report_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'detailed', 'executive'
    content JSONB, -- Full report content
    pdf_url TEXT, -- URL to generated PDF in Supabase Storage
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benchmarks table
CREATE TABLE benchmarks (
    id VARCHAR(50) PRIMARY KEY,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    metric_name VARCHAR(100),
    metric_value DECIMAL(5,2),
    percentile_25 DECIMAL(5,2),
    percentile_50 DECIMAL(5,2),
    percentile_75 DECIMAL(5,2),
    percentile_90 DECIMAL(5,2),
    sample_size INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log for analytics
CREATE TABLE user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    activity_type VARCHAR(100), -- 'question_answered', 'section_completed', 'assessment_started', etc.
    details JSONB, -- Additional activity-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_session_id ON assessments(session_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_industry ON assessments(industry);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();