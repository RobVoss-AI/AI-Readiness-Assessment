console.log('🟢 Index.html JavaScript loaded and running');

// Safe localStorage access
function safeLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value),
            removeItem: (key) => localStorage.removeItem(key)
        };
    } catch (e) {
        console.warn('localStorage not available, using memory storage');
        const memoryStorage = {};
        return {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; },
            removeItem: (key) => { delete memoryStorage[key]; }
        };
    }
}

const storage = safeLocalStorage();

// Form validation and submission
const form = document.getElementById('assessmentForm');
const submitButton = document.getElementById('submitButton');
const buttonText = document.getElementById('buttonText');
const buttonLoading = document.getElementById('buttonLoading');
const progressBar = document.getElementById('progressBar');

// Load existing data if returning user
function loadExistingData() {
    const existingData = JSON.parse(storage.getItem('voss_user') || '{}');

    Object.keys(existingData).forEach(key => {
        const field = document.getElementById(key);
        if (field && existingData[key]) {
            field.value = existingData[key];

            // Handle checkbox
            if (field.type === 'checkbox') {
                field.checked = existingData[key];
            }
        }
    });
}

// Real-time validation
function validateField(fieldId, validationFn, errorMessage) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');

    function validate() {
        const isValid = validationFn(field.value.trim());

        if (isValid) {
            field.classList.remove('border-red-300', 'ring-red-500');
            field.classList.add('border-green-300');
            errorElement.classList.add('hidden');

            // Add success checkmark
            if (!field.parentNode.querySelector('.success-checkmark')) {
                const checkmark = document.createElement('div');
                checkmark.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 success-checkmark';
                checkmark.innerHTML = `
                            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        `;
                field.parentNode.style.position = 'relative';
                field.parentNode.appendChild(checkmark);
            }
        } else {
            field.classList.remove('border-green-300');
            field.classList.add('border-red-300', 'ring-red-500');
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');

            // Remove success checkmark
            const checkmark = field.parentNode.querySelector('.success-checkmark');
            if (checkmark) {
                checkmark.remove();
            }
        }

        // Don't call updateProgress here to avoid infinite loop
        return isValid;
    }

    field.addEventListener('blur', () => {
        validate();
        updateProgress();
    });
    field.addEventListener('input', () => {
        validate();
        updateProgress();
    });

    return validate;
}

// Setup field validation
const validators = {
    firstName: validateField('firstName',
        value => value.length >= 2,
        'Please enter your first name (at least 2 characters)'
    ),
    email: validateField('email',
        value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        'Please enter a valid email address'
    ),
    industry: validateField('industry',
        value => value !== '',
        'Please select your industry'
    ),
    jobTitle: validateField('jobTitle',
        value => value.length >= 2,
        'Please enter your job title'
    ),
    role: validateField('role',
        value => value !== '',
        'Please select your role level'
    )
};

// Consent checkbox validation
const consentCheckbox = document.getElementById('consentMarketing');
const consentError = document.getElementById('consentError');

function validateConsent() {
    const isValid = consentCheckbox.checked;

    if (isValid) {
        consentError.classList.add('hidden');
        consentCheckbox.parentNode.parentNode.classList.remove('border-red-200');
        consentCheckbox.parentNode.parentNode.classList.add('border-green-200', 'bg-green-50');
    } else {
        consentError.classList.remove('hidden');
        consentCheckbox.parentNode.parentNode.classList.add('border-red-200');
        consentCheckbox.parentNode.parentNode.classList.remove('border-green-200', 'bg-green-50');
    }

    // Don't call updateProgress here to avoid infinite loop
    return isValid;
}

consentCheckbox.addEventListener('change', () => {
    validateConsent();
    updateProgress();
});

// Update progress bar
function updateProgress() {
    const totalFields = Object.keys(validators).length + 1; // +1 for consent
    let completedFields = 0;

    Object.values(validators).forEach(validator => {
        if (validator()) completedFields++;
    });

    if (validateConsent()) completedFields++;

    const progress = Math.round((completedFields / totalFields) * 100);
    progressBar.style.width = `${progress}%`;

    // Update progress text
    const progressText = document.querySelector('.mb-3 .text-gray-600:last-child');
    progressText.textContent = `${progress}% Complete`;

    // Enable/disable submit button
    // submitButton.disabled = progress < 100; // Temporarily disabled for testing

    // Update button text based on progress
    if (progress < 100) {
        buttonText.textContent = `Continue to Assessment (${progress}% complete)`;
        // submitButton.classList.add('opacity-50', 'cursor-not-allowed'); // Temporarily disabled
    } else {
        buttonText.textContent = 'Continue to Assessment';
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Auto-save form data
function autoSave() {
    const formData = new FormData(form);
    const userData = {};

    for (let [key, value] of formData.entries()) {
        if (key === 'consentMarketing') {
            userData[key] = document.getElementById(key).checked;
        } else {
            userData[key] = value;
        }
    }

    storage.setItem('voss_user_draft', JSON.stringify(userData));
}

// Auto-save every 2 seconds
let autoSaveTimer;
form.addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSave, 2000);
});

// Send data to collection services
async function sendToDataCollection(userData) {
    console.log('📝 Sending user data to data collection...');
    console.log('User data:', userData);

    // Try multiple collection methods
    const results = await Promise.allSettled([
        sendUserToGoogleSheets(userData),
        saveUserDataLocally(userData)
    ]);

    console.log('User data collection results:', results);
    return results.some(result => result.status === 'fulfilled' && result.value === true);
}

async function sendUserToGoogleSheets(userData) {
    // Environment-aware API configuration
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://api.vossaiconsulting.com/api';
    const BACKEND_API_URL = `${API_BASE}/users`;

    console.log('API Base URL:', API_BASE);
    console.log('Backend API URL:', BACKEND_API_URL);

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'user_data',
                ...userData,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('✅ User data sent to backend API successfully');
            return true;
        } else {
            console.error('❌ Backend API returned error status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending user data to backend API:', error);
        return false;
    }
}

async function saveUserDataLocally(userData) {
    try {
        const dataWithTimestamp = {
            ...userData,
            timestamp: new Date().toISOString(),
            type: 'user_data'
        };

        storage.setItem('voss_user_backup', JSON.stringify(dataWithTimestamp));
        console.log('✅ User data saved locally successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving user data locally:', error);
        return false;
    }
}

// Form submission
form.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('Form submitted');

    // Check rate limiting first (temporarily disabled for debugging)
    // if (!SecurityUtils.checkRateLimit('form_submission', 3, 300000)) {
    //     alert('Too many submission attempts. Please wait 5 minutes and try again.');
    //     return;
    // }

    // Final validation with detailed logging
    let allValid = true;
    const validationResults = {};

    Object.keys(validators).forEach(key => {
        const isValid = validators[key]();
        validationResults[key] = isValid;
        if (!isValid) allValid = false;
    });

    const consentValid = validateConsent();
    validationResults.consent = consentValid;
    if (!consentValid) allValid = false;

    console.log('Validation results:', validationResults);
    console.log('Overall valid:', allValid);

    if (!allValid) {
        console.log('Form validation failed, not proceeding');
        // Scroll to first error
        const firstError = document.querySelector('.border-red-300, .border-red-200');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }

    console.log('✅ All validation passed, proceeding with form submission');

    // Show loading state
    submitButton.disabled = true;
    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');

    // Collect form data
    const formData = new FormData(form);
    const userData = {};

    for (let [key, value] of formData.entries()) {
        if (key === 'consentMarketing') {
            userData[key] = document.getElementById(key).checked;
        } else {
            userData[key] = SecurityUtils.sanitizeText(value);
        }
    }

    // Additional validation with SecurityUtils
    const validationErrors = SecurityUtils.validateUserData(userData);
    if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n' + validationErrors.join('\n'));
        return;
    }

    // Get tier from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tier = urlParams.get('tier') || 'free';

    // Save data locally
    storage.setItem('voss_user', JSON.stringify(userData));
    storage.setItem('voss_tier', tier);
    storage.removeItem('voss_user_draft'); // Clean up draft

    // Send to data collection (async, doesn't block flow)
    console.log('🔄 About to call sendToDataCollection...');
    sendToDataCollection(userData);

    // Simulate processing time for better UX
    setTimeout(() => {
        // Add success animation
        submitButton.innerHTML = `
                    <svg class="w-6 h-6 mr-2 success-checkmark" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Starting Assessment...
                `;

        setTimeout(() => {
            window.location.href = 'assessment-clean.html';
        }, 1000);
    }, 1500);
});

// Ensure button submits the form properly
submitButton.addEventListener('click', function (e) {
    console.log('Submit button clicked, triggering form submit');
    // Let the form submit event handler take care of everything
});

// Load existing data on page load
loadExistingData();

// Initial progress update
updateProgress();

// Add input animations
document.querySelectorAll('.form-input, .select-input').forEach(input => {
    input.addEventListener('focus', function () {
        this.parentNode.classList.add('transform', 'scale-105');
    });

    input.addEventListener('blur', function () {
        this.parentNode.classList.remove('transform', 'scale-105');
    });
});

// Keyboard navigation improvements
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();

        // Find next input
        const inputs = Array.from(document.querySelectorAll('input, select'));
        const currentIndex = inputs.indexOf(e.target);
        const nextInput = inputs[currentIndex + 1];

        if (nextInput) {
            nextInput.focus();
        } else if (submitButton && !submitButton.disabled) {
            submitButton.click();
        }
    }
});

// Preload next page
const link = document.createElement('link');
link.rel = 'prefetch';
link.href = 'assessment-clean.html';
document.head.appendChild(link);