# 🤖 AI Readiness Assessment Tool

A comprehensive web-based assessment tool that evaluates an organization's readiness for AI adoption across six key dimensions.

## 🎯 Overview

The AI Readiness Assessment helps organizations understand their current AI maturity and provides personalized recommendations for successful AI implementation. Built by **Voss AI Consulting** with academic rigor and practical business insights.

## ✨ Features

### 📊 **Assessment Capabilities**
- **6 Core Dimensions**: Strategy, Operations, Technology, Data, Culture, Automation
- **Quantitative Scoring**: Likert scale questions with 0-100% scoring
- **Qualitative Insights**: Open-ended questions for deeper understanding
- **Progress Tracking**: Real-time progress indicators
- **Results Visualization**: Professional radar charts and insights

### 🔒 **Security & Privacy**
- **Enterprise-Grade Security**: XSS protection, input sanitization, rate limiting
- **GDPR Compliant**: Comprehensive privacy policy and user rights
- **Secure Data Flow**: Encrypted transmission to Google Sheets
- **Real-time Monitoring**: Security violation detection and logging

### 📱 **User Experience**
- **Mobile-First Design**: Responsive across all devices
- **Professional Branding**: VossAI consulting branding throughout
- **Accessibility**: WCAG compliant design
- **Fast Performance**: Optimized loading and interactions

## 🏗️ Architecture

### **Frontend**
- **HTML5/CSS3/JavaScript**: Pure vanilla JS, no frameworks
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Professional data visualization
- **Progressive Enhancement**: Works without JavaScript

### **Data Flow**
```
User Input → Sanitization → Local Storage → Multiple Collection Methods:
├── Google Apps Script → Google Sheets (Primary)
├── Webhook Service → External Database (Backup)
└── Local Storage → Export Utility (Failsafe)
```

### **Security Stack**
- **CSP Headers**: Content Security Policy protection
- **Input Validation**: Multi-layer sanitization
- **Rate Limiting**: Prevents abuse and spam
- **HTTPS Enforcement**: Secure connections only

## 📁 Project Structure

```
├── VossAIOpportunityScorecard.html    # Landing page
├── index.html                         # User info collection
├── assessment-clean.html              # Main assessment (6 sections)
├── results-new.html                  # Results with radar chart
├── data-export.html                  # Data export utility
├── test-data-collection.html         # Testing data collection
├── privacy-policy.html               # GDPR-compliant privacy policy
├── terms-of-service.html             # Legal terms and conditions
├── security-utils.js                 # Security utilities
├── security-monitor.js               # Real-time security monitoring
├── google-apps-script.js             # Google Sheets backend script
├── .htaccess                         # Server security headers
└── README.md                         # This file
```

## 🚀 Deployment

### **Recommended Hosting**
- **Netlify** (Recommended) - Automatic HTTPS, security headers
- **Vercel** - Excellent performance and security
- **CloudFlare Pages** - Advanced security features

### **Quick Deploy**
1. Fork this repository
2. Connect to your hosting provider
3. Enable automatic deployments
4. Configure custom domain (optional)

### **Manual Deploy**
1. Download/clone repository
2. Upload files to web hosting
3. Ensure `.htaccess` is active (Apache servers)
4. Verify HTTPS is working
5. Test security headers

## ⚙️ Configuration

### **Data Collection Setup**

#### **Google Sheets Integration (Primary)**
1. Create new Google Apps Script project
2. Copy contents from `google-apps-script.js`
3. Deploy as web app with permissions set to "Anyone"
4. Update `GOOGLE_SCRIPT_URL` in:
   - `user-info.html` (line ~710)
   - `results-new.html` (line ~456)

#### **Data Export & Testing**
- Access `data-export.html` to view/export collected data
- Use `test-data-collection.html` to verify data collection works
- Check browser console for debugging information

#### **Backup Collection Methods**
- Local storage always saves data as backup
- Webhook service can be configured for external collection
- Multiple collection methods ensure no data loss

### **Customization**
- **Branding**: Update logos and colors in CSS
- **Questions**: Modify assessment questions in `assessment-clean.html`
- **Scoring**: Adjust scoring logic in assessment files
- **Legal**: Update privacy policy and terms as needed

## 🔧 Local Development

### **Setup**
```bash
# Clone repository
git clone [your-repo-url]
cd ai-readiness-assessment

# Start local server
python3 -m http.server 8000
# OR
npx serve .

# Open in browser
open http://localhost:8000
```

### **Testing**
- **Security**: Run security tests from deployment checklist
- **Functionality**: Complete full assessment flow
- **Mobile**: Test on various device sizes
- **Performance**: Check loading times

## 📊 Assessment Dimensions

### 1. **Strategy & Vision**
- AI vision and business value alignment
- Problem identification and prioritization
- Leadership support and budget allocation

### 2. **Operations**
- Process documentation and mapping
- Change readiness and efficiency metrics
- Automation candidate identification

### 3. **Technology**
- Infrastructure and cloud readiness
- Data systems integration
- Security and compliance frameworks

### 4. **Data Quality & Governance**
- Data quality and accessibility
- Governance policies and procedures
- Privacy and compliance frameworks

### 5. **Culture**
- Employee enthusiasm and learning mindset
- Change adaptation and collaboration
- Innovation culture assessment

### 6. **Automation**
- Current automation experience
- Tool familiarity and ROI measurement
- Implementation readiness

## 🛡️ Security Features

- **XSS Protection**: Real-time script injection prevention
- **Rate Limiting**: 3 submissions per 5 minutes
- **Input Sanitization**: All user inputs cleaned and validated
- **CSP Headers**: Content Security Policy implementation
- **HTTPS Enforcement**: Secure connections required
- **Privacy Compliance**: GDPR-ready privacy controls

## 📈 Analytics & Insights

### **Data Collected**
- User demographics (industry, role, company size)
- Assessment responses (Likert scale + open-ended)
- Completion rates and section performance
- Security events and violations

### **Business Intelligence**
- Industry benchmarking capabilities
- AI readiness trends analysis
- Common challenge identification
- Market opportunity insights

## 🤝 Contributing

This is a proprietary project by Voss AI Consulting. For questions or collaboration opportunities:

- **Email**: robvoss@vossaiconsulting.com
- **Phone**: 660-215-1313
- **Website**: [vossaiconsulting.com](https://vossaiconsulting.com)

## 📄 License

© 2024 Voss AI Consulting. All rights reserved.

This project is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

## 🔄 Version History

- **v1.0** - Initial release with 6-dimension assessment
- **v1.1** - Added open-ended questions and enhanced security
- **v1.2** - Implemented comprehensive security monitoring
- **v1.3** - Added legal compliance and privacy controls

## 🎓 About Voss AI Consulting

Led by Dr. Robert Voss, we bridge academic insight with business AI innovation. Specializing in AI readiness assessments, strategic planning, and implementation support for organizations ready to transform with AI.

**Academic Excellence Meets Business Innovation**

---

*For technical support or business inquiries, please contact Voss AI Consulting.*