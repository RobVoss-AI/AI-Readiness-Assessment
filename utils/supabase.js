const { createClient } = require('@supabase/supabase-js');

class SupabaseClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_API_KEY;

      if (!url || !key) {
        console.log('[supabase] SUPABASE_URL / SUPABASE_API_KEY not set — skipping');
        return null;
      }

      this.client = createClient(url, key, {
        auth: { autoRefreshToken: true, persistSession: false }
      });

      this.isConnected = await this.testConnection();
      return this.client;
    } catch (error) {
      console.error('[supabase] init failed:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  async testConnection() {
    try {
      // Use assessments table — always exists per schema.sql
      const { error } = await this.client
        .from('assessments')
        .select('id')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Assessment CRUD ---

  async saveAssessment(data) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data: result, error } = await this.client
        .from('assessments')
        .insert([data])
        .select();
      if (error) throw error;
      return result[0];
    } catch (e) {
      console.error('[supabase] saveAssessment:', e.message);
      return null;
    }
  }

  async getAssessment(id) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[supabase] getAssessment:', e.message);
      return null;
    }
  }

  async updateAssessment(id, updates) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.error('[supabase] updateAssessment:', e.message);
      return null;
    }
  }

  // --- User CRUD ---

  async createUser(userData) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('users')
        .insert([userData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.error('[supabase] createUser:', e.message);
      return null;
    }
  }

  async getUser(email) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[supabase] getUser:', e.message);
      return null;
    }
  }

  // --- Stats ---

  async getAssessmentStats() {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('assessments')
        .select('score, completed_at, industry, company_size')
        .not('completed_at', 'is', null);
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[supabase] getAssessmentStats:', e.message);
      return null;
    }
  }
}

module.exports = new SupabaseClient();
