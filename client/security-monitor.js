// Security Monitoring for AI Assessment
class SecurityMonitor {
    
    constructor() {
        this.enabled = true;
        this.violations = [];
        this.startTime = Date.now();
        this.init();
    }
    
    init() {
        // Monitor for suspicious activity
        this.setupFormSubmissionMonitoring();
        this.setupXSSDetection();
        this.setupCSPViolationReporting();
        this.setupErrorLogging();
        
        console.log('🛡️ Security monitoring initialized');
    }
    
    // Monitor form submission patterns
    setupFormSubmissionMonitoring() {
        let submissionTimes = [];
        
        document.addEventListener('submit', (e) => {
            const now = Date.now();
            submissionTimes.push(now);
            
            // Remove submissions older than 1 minute
            submissionTimes = submissionTimes.filter(time => now - time < 60000);
            
            // Check for rapid submissions (potential bot)
            if (submissionTimes.length > 3) {
                this.logViolation('rapid_submissions', {
                    count: submissionTimes.length,
                    times: submissionTimes
                });
                
                // Rate limit
                e.preventDefault();
                alert('Too many submission attempts. Please wait a moment.');
            }
        });
    }
    
    // Detect potential XSS attempts
    setupXSSDetection() {
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /onload=/i,
            /onerror=/i,
            /onclick=/i,
            /<iframe/i,
            /vbscript:/i,
            /expression\s*\(/i
        ];
        
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const value = e.target.value;
                
                for (const pattern of dangerousPatterns) {
                    if (pattern.test(value)) {
                        this.logViolation('xss_attempt', {
                            pattern: pattern.toString(),
                            value: value.substring(0, 100), // First 100 chars
                            element: e.target.name || e.target.id
                        });
                        
                        // Clear the dangerous input
                        e.target.value = value.replace(pattern, '[FILTERED]');
                        break;
                    }
                }
            }
        });
    }
    
    // CSP Violation Reporting
    setupCSPViolationReporting() {
        document.addEventListener('securitypolicyviolation', (e) => {
            this.logViolation('csp_violation', {
                violatedDirective: e.violatedDirective,
                blockedURI: e.blockedURI,
                sourceFile: e.sourceFile,
                lineNumber: e.lineNumber
            });
        });
    }
    
    // Enhanced Error Logging
    setupErrorLogging() {
        window.addEventListener('error', (e) => {
            this.logViolation('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error ? e.error.stack : null
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.logViolation('unhandled_promise_rejection', {
                reason: e.reason,
                promise: e.promise
            });
        });
    }
    
    // Log security violations
    logViolation(type, details) {
        const violation = {
            type,
            details,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        this.violations.push(violation);
        
        // Log to console in development
        console.warn('🚨 Security Violation:', violation);
        
        // In production, you might want to send this to a logging service
        // this.sendToLoggingService(violation);
        
        // Store locally for debugging
        try {
            const storedViolations = JSON.parse(localStorage.getItem('security_violations') || '[]');
            storedViolations.push(violation);
            // Keep only last 50 violations
            if (storedViolations.length > 50) {
                storedViolations.splice(0, storedViolations.length - 50);
            }
            localStorage.setItem('security_violations', JSON.stringify(storedViolations));
        } catch (e) {
            console.error('Failed to store security violation:', e);
        }
    }
    
    // Get security report
    getSecurityReport() {
        return {
            sessionStart: new Date(this.startTime).toISOString(),
            violationsCount: this.violations.length,
            violations: this.violations,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }
    
    // Send violation to logging service (implement as needed)
    sendToLoggingService(violation) {
        // Example implementation:
        // fetch('/api/security-log', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(violation)
        // }).catch(console.error);
    }
}

// Initialize security monitoring when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.securityMonitor = new SecurityMonitor();
    });
} else {
    window.securityMonitor = new SecurityMonitor();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityMonitor;
}