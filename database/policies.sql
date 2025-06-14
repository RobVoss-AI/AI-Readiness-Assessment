-- Row Level Security (RLS) Policies for Supabase
-- Run this in your Supabase SQL Editor after creating the schema

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessments table policies
-- Users can access their own assessments or anonymous sessions
CREATE POLICY "Users can view own assessments" ON assessments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can create assessments" ON assessments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can update own assessments" ON assessments
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

-- Assessment reports table policies
CREATE POLICY "Users can view own reports" ON assessment_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_reports.assessment_id 
            AND (assessments.user_id = auth.uid() OR assessments.session_id IS NOT NULL)
        )
    );

-- User activities table policies
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can create activities" ON user_activities
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

-- Public read access for questions and reference data
-- (These don't contain sensitive user data)
CREATE POLICY "Anyone can read question sections" ON question_sections
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read questions" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read industry modules" ON industry_modules
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read benchmarks" ON benchmarks
    FOR SELECT USING (true);

-- Admin policies (for service role key)
-- Allow full access for backend operations
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access assessments" ON assessments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access reports" ON assessment_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access activities" ON user_activities
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to manage reference data
CREATE POLICY "Service role manage question sections" ON question_sections
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manage questions" ON questions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manage industry modules" ON industry_modules
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manage benchmarks" ON benchmarks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');