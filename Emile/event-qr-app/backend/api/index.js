require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeFirebase } = require('../src/config/firebase');

// Import routes
const authRoutes = require('../src/routes/auth');
const eventRoutes = require('../src/routes/events');
const ticketRoutes = require('../src/routes/tickets');
const paypalRoutes = require('../src/routes/paypal');
const webhookRoutes = require('../src/routes/webhooks');
const organizerRoutes = require('../src/routes/organizer');

const app = express();

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/organizer', organizerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

module.exports = app;
