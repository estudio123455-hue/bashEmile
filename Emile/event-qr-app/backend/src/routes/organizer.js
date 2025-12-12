const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
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

/**
 * POST /api/organizer/events
 * Create a new event (organizers only)
 */
router.post('/events', auth, requireRole('organizer'), createEventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, description, date, time, location, category, ticketPrice, capacity, imageUrl } = req.body;

    // Create event with organizer ID from token (NEVER trust client-sent organizerId)
    const eventData = {
      organizerId: req.userId, // Always from verified token
      title,
      description,
      date,
      time,
      location,
      category,
      ticketPrice: parseFloat(ticketPrice),
      capacity: parseInt(capacity),
      availableTickets: parseInt(capacity), // Initially all tickets available
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
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating event',
    });
  }
});

/**
 * GET /api/organizer/events
 * Get all events for the current organizer
 */
router.get('/events', auth, requireRole('organizer'), async (req, res) => {
  try {
    const events = await eventService.findByOrganizerId(req.userId);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching events',
    });
  }
});

/**
 * GET /api/organizer/events/:id
 * Get single event details (must be owned by organizer)
 */
router.get('/events/:id', auth, requireRole('organizer'), async (req, res) => {
  try {
    const event = await eventService.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Verify ownership
    if (event.organizerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this event',
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
 * PUT /api/organizer/events/:id
 * Update an event (must be owned by organizer)
 */
router.put('/events/:id', auth, requireRole('organizer'), async (req, res) => {
  try {
    const event = await eventService.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Verify ownership
    if (event.organizerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this event',
      });
    }

    const { title, description, date, time, location, category, ticketPrice, capacity, imageUrl, status } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(date && { date }),
      ...(time && { time }),
      ...(location && { location }),
      ...(category && { category }),
      ...(ticketPrice !== undefined && { ticketPrice: parseFloat(ticketPrice) }),
      ...(capacity && { capacity: parseInt(capacity) }),
      ...(imageUrl && { imageUrl }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    const updatedEvent = await eventService.update(req.params.id, updateData);

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating event',
    });
  }
});

/**
 * GET /api/organizer/events/:id/stats
 * Get event statistics (tickets sold, scanned, revenue)
 */
router.get('/events/:id/stats', auth, requireRole('organizer'), async (req, res) => {
  try {
    const event = await eventService.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Verify ownership
    if (event.organizerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this event',
      });
    }

    const stats = {
      totalCapacity: event.capacity,
      ticketsSold: event.ticketsSold || 0,
      ticketsScanned: event.ticketsScanned || 0,
      availableTickets: event.availableTickets || event.capacity,
      revenue: (event.ticketsSold || 0) * event.ticketPrice,
      occupancyRate: event.capacity > 0 ? ((event.ticketsSold || 0) / event.capacity * 100).toFixed(1) : 0,
      scanRate: event.ticketsSold > 0 ? ((event.ticketsScanned || 0) / event.ticketsSold * 100).toFixed(1) : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching event stats',
    });
  }
});

module.exports = router;
