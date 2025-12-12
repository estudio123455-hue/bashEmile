const express = require('express');
const { body, validationResult } = require('express-validator');
const { optionalAuth, auth, requirePremium } = require('../middleware/auth');
const { eventService } = require('../services/firebaseService');

const router = express.Router();

// Validation rules for creating an event
const createEventValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('location').trim().isLength({ min: 3, max: 200 }).withMessage('Location must be 3-200 characters'),
  body('category').isIn(['music', 'sports', 'conference', 'theater', 'festival', 'other']).withMessage('Invalid category'),
  body('ticketPrice').isFloat({ min: 0 }).withMessage('Ticket price must be >= 0'),
  body('capacity').isInt({ min: 1, max: 100000 }).withMessage('Capacity must be between 1 and 100,000'),
  body('imageUrl').optional().isURL().withMessage('Invalid image URL'),
];

// GET /api/events - Get all published events (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;

    const events = await eventService.findAll({ category, search, limit, offset });

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total: events.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: events.length >= parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching events',
    });
  }
});

// GET /api/events/:id - Get single event (public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await eventService.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching event',
    });
  }
});

/**
 * POST /api/events
 * Create a new event (PREMIUM USERS ONLY)
 */
router.post('/', auth, requirePremium, createEventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, description, date, time, location, category, ticketPrice, capacity, imageUrl } = req.body;

    // Create event with publisher ID from token (NEVER trust client-sent publisherId)
    const eventData = {
      publisherId: req.userId, // Always from verified token
      title,
      description,
      date,
      time,
      location,
      category,
      ticketPrice: parseFloat(ticketPrice),
      capacity: parseInt(capacity),
      availableTickets: parseInt(capacity),
      ticketsSold: 0,
      ticketsScanned: 0,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      status: 'published',
      currency: 'COP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const event = await eventService.create(eventData);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event published successfully',
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating event',
    });
  }
});

module.exports = router;
