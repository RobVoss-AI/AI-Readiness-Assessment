// routes/payment.js - Stripe payment processing
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create payment intent for premium assessment
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { userData, assessmentId } = req.body;
        
        if (!userData || !userData.email) {
            return res.status(400).json({ error: 'User data and email required' });
        }

        // Create or retrieve customer
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: userData.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: userData.email,
                name: userData.firstName,
                metadata: {
                    industry: userData.industry,
                    role: userData.role,
                    jobTitle: userData.jobTitle,
                    assessmentId: assessmentId || 'direct'
                }
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 7000, // $70.00 in cents
            currency: 'usd',
            customer: customer.id,
            description: 'AI Opportunity Scorecard - Premium Insights',
            metadata: {
                service: 'ai_assessment_premium',
                industry: userData.industry,
                role: userData.role,
                assessmentId: assessmentId || 'direct'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            customerId: customer.id,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ 
            error: 'Failed to create payment intent',
            message: error.message 
        });
    }
});

// Confirm payment and unlock premium features
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, assessmentData } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID required' });
        }

        // Retrieve payment intent to verify payment
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ 
                error: 'Payment not completed',
                status: paymentIntent.status 
            });
        }

        // Generate premium access token (in production, store this in a database)
        const premiumToken = generatePremiumToken(paymentIntent.customer, paymentIntentId);

        // Log successful payment
        console.log('✅ Premium payment confirmed:', {
            customer: paymentIntent.customer,
            amount: paymentIntent.amount,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            premiumToken,
            message: 'Payment confirmed - Premium features unlocked',
            receiptUrl: paymentIntent.charges.data[0]?.receipt_url
        });

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ 
            error: 'Failed to confirm payment',
            message: error.message 
        });
    }
});

// Verify premium access
router.post('/verify-premium', async (req, res) => {
    try {
        const { premiumToken } = req.body;

        if (!premiumToken) {
            return res.status(400).json({ error: 'Premium token required' });
        }

        // Verify token (in production, check against database)
        const isValid = verifyPremiumToken(premiumToken);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or expired premium token' });
        }

        res.json({
            valid: true,
            features: ['gpt_insights', 'detailed_report', 'pdf_export', 'priority_support']
        });

    } catch (error) {
        console.error('Premium verification error:', error);
        res.status(500).json({ 
            error: 'Failed to verify premium access',
            message: error.message 
        });
    }
});

// Get payment history for customer (for support purposes)
router.get('/history/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        const paymentIntents = await stripe.paymentIntents.list({
            customer: customerId,
            limit: 10
        });

        const history = paymentIntents.data.map(pi => ({
            id: pi.id,
            amount: pi.amount,
            status: pi.status,
            created: new Date(pi.created * 1000),
            description: pi.description
        }));

        res.json({ history });

    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve payment history',
            message: error.message 
        });
    }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle specific events
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('💰 Payment succeeded:', event.data.object.id);
            // Here you could trigger email notifications, update database, etc.
            break;
        
        case 'payment_intent.payment_failed':
            console.log('❌ Payment failed:', event.data.object.id);
            // Handle failed payments
            break;
        
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Helper functions
function generatePremiumToken(customerId, paymentIntentId) {
    // In production, use a proper JWT or store in database with expiration
    const tokenData = {
        customerId,
        paymentIntentId,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

function verifyPremiumToken(token) {
    try {
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // Check if token is expired
        if (Date.now() > tokenData.expires) {
            return false;
        }
        
        // In production, verify against database and check payment status
        return true;
        
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

module.exports = router;