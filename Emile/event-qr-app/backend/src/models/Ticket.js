const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'valid', 'used', 'cancelled', 'expired'],
    default: 'pending',
  },
  paypalOrderId: {
    type: String,
  },
  paypalTransactionId: {
    type: String,
  },
  qrCode: {
    type: String,
  },
  qrToken: {
    type: String,
  },
  qrTokenExpiry: {
    type: Date,
  },
  usedAt: {
    type: Date,
  },
  eventSnapshot: {
    title: String,
    date: Date,
    time: String,
    location: String,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate QR token
ticketSchema.methods.generateQRToken = function() {
  const crypto = require('crypto');
  this.qrToken = crypto.randomBytes(32).toString('hex');
  this.qrTokenExpiry = new Date(Date.now() + 30000); // 30 seconds
  return this.qrToken;
};

// Check if QR token is valid
ticketSchema.methods.isQRTokenValid = function(token) {
  return this.qrToken === token && this.qrTokenExpiry > new Date();
};

// Index for queries
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ paypalOrderId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
