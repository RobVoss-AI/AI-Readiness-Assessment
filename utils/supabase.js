const { createClient } = require('@supabase/supabase-js');

class SupabaseClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    initialize() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!supabaseUrl || !supabaseServiceKey) {
                console.warn('⚠️  Supabase credentials not found in environment variables');
                console.warn('   Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
                return null;
            }

            this.client = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            this.isConnected = true;
            console.log('✅ Supabase client initialized');
            return this.client;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error.message);
            this.isConnected = false;
            return null;
        }
    }

    // Assessment management
    async saveAssessment(data) {
        if (!this.client) return null;
        
        try {
            const { data: result, error } = await this.client
                .from('assessments')
                .insert([data])
                .select();

            if (error) throw error;
            return result[0];
        } catch (error) {
            console.error('Supabase save assessment error:', error);
            return null;
        }
    }

    async getAssessment(id) {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('assessments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase get assessment error:', error);
            return null;
        }
    }

    async updateAssessment(id, updates) {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('assessments')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Supabase update assessment error:', error);
            return null;
        }
    }

    // User management
    async createUser(userData) {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('users')
                .insert([userData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Supabase create user error:', error);
            return null;
        }
    }

    async getUser(email) {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase get user error:', error);
            return null;
        }
    }

    // Question management
    async getQuestions(filters = {}) {
        if (!this.client) return null;
        
        try {
            let query = this.client.from('questions').select('*');
            
            if (filters.industry) {
                query = query.contains('industries', [filters.industry]);
            }
            
            if (filters.role) {
                query = query.contains('roles', [filters.role]);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase get questions error:', error);
            return null;
        }
    }

    // Analytics
    async getAssessmentStats() {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('assessments')
                .select('score, completed_at, industry, company_size')
                .not('completed_at', 'is', null);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase get stats error:', error);
            return null;
        }
    }

    // Real-time subscriptions
    subscribeToAssessments(callback) {
        if (!this.client) return null;
        
        return this.client
            .channel('assessments')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'assessments'
            }, callback)
            .subscribe();
    }
}

const supabaseClient = new SupabaseClient();

module.exports = supabaseClient;