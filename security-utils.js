// Security utilities for AI Assessment
class SecurityUtils {
    
    // Sanitize text input to prevent XSS
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim()
            .substring(0, 5000); // Limit length
    }
    
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    // Validate form inputs
    static validateUserData(userData) {
        const errors = [];
        
        if (!userData.firstName || userData.firstName.length < 2 || userData.firstName.length > 50) {
            errors.push('First name must be 2-50 characters');
        }
        
        if (!this.isValidEmail(userData.email)) {
            errors.push('Invalid email address');
        }
        
        if (!userData.industry || userData.industry.length === 0) {
            errors.push('Industry is required');
        }
        
        if (!userData.jobTitle || userData.jobTitle.length < 2 || userData.jobTitle.length > 100) {
            errors.push('Job title must be 2-100 characters');
        }
        
        if (!userData.role || userData.role.length === 0) {
            errors.push('Role level is required');
        }
        
        return errors;
    }
    
    // Rate limiting for form submissions
    static checkRateLimit(key, maxAttempts = 5, windowMs = 300000) { // 5 attempts per 5 minutes
        try {
            const now = Date.now();
            const attempts = JSON.parse(localStorage.getItem(`rate_${key}`) || '[]');
            const recentAttempts = attempts.filter(time => now - time < windowMs);
            
            if (recentAttempts.length >= maxAttempts) {
                return false; // Rate limited
            }
            
            recentAttempts.push(now);
            localStorage.setItem(`rate_${key}`, JSON.stringify(recentAttempts));
            return true;
        } catch (e) {
            return true; // Allow if localStorage fails
        }
    }
    
    // Sanitize data before sending to Google Sheets
    static sanitizeForGoogleSheets(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeText(value);
            } else if (typeof value === 'number') {
                sanitized[key] = isNaN(value) ? 0 : value;
            } else if (typeof value === 'boolean') {
                sanitized[key] = Boolean(value);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively sanitize nested objects (like scores and freeResponses)
                sanitized[key] = this.sanitizeForGoogleSheets(value);
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item => 
                    typeof item === 'object' ? this.sanitizeForGoogleSheets(item) : item
                );
            } else {
                sanitized[key] = String(value);
            }
        }
        
        return sanitized;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
} else {
    window.SecurityUtils = SecurityUtils;
}