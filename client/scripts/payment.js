
document.getElementById("currentYear").textContent = new Date().getFullYear();

// Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://your-api-domain.com/api'
    : 'http://localhost:3001/api';

// Initialize Stripe
const stripe = Stripe('pk_test_your_stripe_publishable_key_here'); // Replace with your actual key
let elements, cardElement, paymentIntent;

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
        console.warn('localStorage not available');
        const memoryStorage = {};
        return {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; },
            removeItem: (key) => { delete memoryStorage[key]; }
        };
    }
}

const storage = safeLocalStorage();

// Load user data and initialize payment
async function initializePayment() {
    try {
        // Get user data
        const userData = JSON.parse(storage.getItem("voss_user") || "null");
        if (!userData) {
            window.location.href = "assessment.html";
            return;
        }

        // Display user info
        document.getElementById("userDetails").textContent =
            `${userData.firstName} • ${userData.industry} • ${userData.role}`;

        // Initialize Stripe Elements
        elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
            },
        });
        cardElement.mount('#card-element');

        // Handle card errors
        cardElement.on('change', ({ error }) => {
            const displayError = document.getElementById('card-errors');
            if (error) {
                displayError.textContent = error.message;
            } else {
                displayError.textContent = '';
            }
        });

        // Create payment intent
        await createPaymentIntent(userData);

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize payment system. Please try again.');
    }
}

// Create payment intent with backend
async function createPaymentIntent(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userData: userData,
                assessmentId: generateAssessmentId()
            }),
        });

        if (!response.ok) {
            throw new Error(`Payment setup failed: ${response.statusText}`);
        }

        const data = await response.json();
        paymentIntent = data;

        console.log('Payment intent created:', data.paymentIntentId);

    } catch (error) {
        console.error('Payment intent creation error:', error);
        showError('Failed to set up payment. Please try again.');
    }
}

// Handle form submission
document.getElementById('payment-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!paymentIntent || !paymentIntent.clientSecret) {
        showError('Payment system not ready. Please refresh and try again.');
        return;
    }

    setLoading(true);

    try {
        // Confirm payment with Stripe
        const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
            paymentIntent.clientSecret,
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: JSON.parse(storage.getItem("voss_user")).firstName,
                        email: JSON.parse(storage.getItem("voss_user")).email,
                    },
                }
            }
        );

        if (error) {
            console.error('Payment confirmation error:', error);
            showError(error.message || 'Payment failed. Please try again.');
            setLoading(false);
            return;
        }

        // Payment succeeded
        console.log('Payment confirmed:', confirmedPayment.id);

        // Confirm with backend and get premium token
        await confirmPaymentWithBackend(confirmedPayment.id);

    } catch (error) {
        console.error('Payment processing error:', error);
        showError('Payment processing failed. Please try again.');
        setLoading(false);
    }
});

// Confirm payment with backend
async function confirmPaymentWithBackend(paymentIntentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payment/confirm-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId: paymentIntentId,
                assessmentData: {
                    userData: JSON.parse(storage.getItem("voss_user")),
                    scores: JSON.parse(storage.getItem("voss_scores")),
                    answers: JSON.parse(storage.getItem("voss_answers"))
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Payment confirmation failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Store premium token
        storage.setItem("voss_premium_token", data.premiumToken);
        storage.setItem("voss_tier", "premium");

        // Show success and redirect
        showSuccess();

        // Generate premium insights
        await generatePremiumInsights(data.premiumToken);

    } catch (error) {
        console.error('Backend confirmation error:', error);
        showError('Payment processed but activation failed. Please contact support.');
    }
}

// Generate premium insights
async function generatePremiumInsights(premiumToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/insights/generate-premium`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userData: JSON.parse(storage.getItem("voss_user")),
                scores: JSON.parse(storage.getItem("voss_scores")),
                answers: JSON.parse(storage.getItem("voss_answers")),
                premiumToken: premiumToken
            }),
        });

        if (!response.ok) {
            throw new Error(`Insights generation failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Store premium insights
        storage.setItem("voss_premium_insights", JSON.stringify(data.insights));

        console.log('Premium insights generated successfully');

    } catch (error) {
        console.error('Insights generation error:', error);
        // Continue anyway - user can still access basic results
    }
}

// Helper functions
function setLoading(loading) {
    const button = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const buttonLoading = document.getElementById('button-loading');

    button.disabled = loading;

    if (loading) {
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
    } else {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    errorDiv.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span>${message}</span>
                </div>
            `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess() {
    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('payment-success').classList.remove('hidden');

    // Redirect after 3 seconds
    setTimeout(() => {
        window.location.href = 'results.html';
    }, 3000);
}

function generateAssessmentId() {
    return 'assess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize when page loads
initializePayment();