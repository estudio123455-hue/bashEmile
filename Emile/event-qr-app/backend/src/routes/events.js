const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { eventService } = require('../services/firebaseService');

const router = express.Router();

// GET /api/events - Get all events
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

// GET /api/events/:id - Get single event
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

module.exports = router;
