// server.js - Main backend server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Stricter rate limit for GPT endpoints
const gptLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // limit each IP to 10 GPT requests per hour
});

// Routes
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/insights', gptLimiter, require('./routes/insights'));
app.use('/api/email', require('./routes/email'));
app.use('/api/benchmarks', require('./routes/benchmarks'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Assessment API: http://localhost:${PORT}/api/assessment`);
    console.log(`💳 Payment API: http://localhost:${PORT}/api/payment`);
    console.log(`🤖 Insights API: http://localhost:${PORT}/api/insights`);
});

module.exports = app;