const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    maxlength: 300,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'COP',
    enum: ['COP', 'USD'],
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0,
  },
  totalTickets: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: 'general',
    enum: ['concert', 'festival', 'conference', 'sports', 'theater', 'general'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Index for searching
eventSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Event', eventSchema);
