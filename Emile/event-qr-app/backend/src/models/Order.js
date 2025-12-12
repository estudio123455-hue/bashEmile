const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  subtotalCOP: {
    type: Number,
    required: true,
  },
  subtotalUSD: {
    type: Number,
    required: true,
  },
  paypalFee: {
    type: Number,
    default: 0,
  },
  platformFee: {
    type: Number,
    default: 0,
  },
  totalUSD: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'approved', 'completed', 'cancelled', 'failed'],
    default: 'created',
  },
  paypalOrderId: {
    type: String,
  },
  paypalCaptureId: {
    type: String,
  },
  paypalPayerId: {
    type: String,
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ paypalOrderId: 1 });

module.exports = mongoose.model('Order', orderSchema);
